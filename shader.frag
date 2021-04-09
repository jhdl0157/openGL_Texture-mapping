#version 150 core

uniform vec3 cameraPos;
uniform vec3 lightColor;
uniform vec3 ambientLight;
uniform vec3 color;
uniform vec3 lightPos;
uniform float shineness;
uniform vec4 diffuseMaterial;
uniform vec4 specularMaterial;
uniform sampler2D diffTex;
uniform sampler2D bumpTex;
uniform sampler2D shadowMap;

in vec2 texCoord;
in vec3 normal;
in vec3 worldPos;

in vec4 shadowCoord;

out vec4 out_Color;

mat3 getTBN( vec3 N ) {
	vec3 Q1 = dFdx(worldPos), Q2 = dFdy(worldPos);
	vec2 st1 = dFdx(texCoord), st2 = dFdy(texCoord);
	float D = st1.s*st2.t-st2.s*st1.t;
	return mat3(normalize(( Q1*st2.t - Q2*st1.t )*D),normalize((-Q1*st2.s + Q2*st1.s )*D), N);
}
#define TEX_DELTA 0.0001
void main(void)
{
	vec3 N =normalize(normal);
	vec3 L= normalize(lightPos-worldPos);
	mat3 TBN = getTBN( N );
	float Bu = texture( bumpTex, texCoord+vec2(TEX_DELTA,0) ).r 
	         - texture( bumpTex, texCoord-vec2(TEX_DELTA,0) ).r;
	float Bv = texture( bumpTex, texCoord+vec2(0,TEX_DELTA) ).r 
	         - texture( bumpTex, texCoord-vec2(0,TEX_DELTA) ).r;
	vec3 bumpVec = vec3(-Bu*15., -Bv*15., 1 );
	N = normalize( TBN* bumpVec );
	
	vec3 V=normalize(cameraPos-worldPos);
	vec3 R=N*dot(N,L)*2.-L;
	//vec3 lightint = lightColor/dot(L,L);
	vec3 specularColor=pow(clamp(dot(R,V),0.,1.),shineness)*lightColor;

	vec4 diffuseTexMaterial=texture(diffTex, texCoord);
	diffuseTexMaterial.rgb=pow(diffuseTexMaterial.rgb,vec3(2.2));

	vec3 lighting= ambientLight*color+color*max(0.,dot(N,L))*lightColor+specularColor;
	

	////
	float visibility = 1.0;
	vec3 sCoord = shadowCoord.xyz/shadowCoord.w;
	if( texture(shadowMap,sCoord.xy).r < sCoord.z ) visibility = 0;

	vec3 lColor=lightColor*visibility;
	float diffuseFactor=clamp(dot(N,L),0,1);
	float specularFactor=pow(clamp(dot(R,V),0,1),shineness);
	lighting+= diffuseMaterial.rgb*diffuseFactor*lColor;
	lighting+= specularMaterial.rgb*specularFactor*lColor;
	lighting+= diffuseTexMaterial.rgb*ambientLight;


	out_Color = vec4(pow(lighting,vec3(1/2.2)),diffuseMaterial.a);
}
