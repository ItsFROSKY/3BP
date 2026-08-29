#version 330

in vec3 fragPosition;
in vec3 fragNormal;
in vec2 fragTexCoord;

out vec4 finalColor;

uniform vec3 u_viewPos;
uniform vec3 u_starColor;
uniform float u_time;
uniform float u_luminosity;

// Simplex/Perlin noise helper
float hash(vec3 p){
    p=fract(p*vec3(443.897,441.423,437.195));
    p+=dot(p,p.yzx+19.19);
    return fract((p.x+p.y)*p.z);
}

float noise(vec3 p){
    vec3 i=floor(p);
    vec3 f=fract(p);
    f=f*f*(3.-2.*f);
    return mix(
        mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
        mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
        mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
        mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
    }
    
    // Fractional Brownian Motion for turbulent plasma details
    float fbm(vec3 p){
        float val=0.;
        float amp=.5;
        for(int i=0;i<4;i++){
            val+=amp*noise(p);
            p*=2.02;
            amp*=.5;
        }
        return val;
    }
    
    void main(){
        vec3 N=normalize(fragNormal);
        vec3 V=normalize(u_viewPos-fragPosition);
        
        // Fresnel Rim Effect: Flames are brightest at the star silhouette
        float rim=1.-max(dot(V,N),0.);
        rim=pow(rim,2.);
        
        // Domain Warping for dynamic liquid plasma turbulence
        vec3 p=fragPosition*2.5;
        vec3 q=vec3(fbm(p+vec3(0.,u_time*.4,0.)),
        fbm(p+vec3(5.2,1.3,u_time*.3)),
        fbm(p+vec3(1.9,8.4,0.)));
        
        vec3 r=vec3(fbm(p+4.*q+vec3(1.7,9.2,u_time*.5)),
        fbm(p+4.*q+vec3(8.3,2.8,u_time*.2)),
        fbm(p+4.*q+vec3(2.5,4.1,0.)));
        
        float flamePattern=fbm(p+4.*r);
        
        // Color gradient mapping: Core hot white/yellow -> Outer deep color
        vec3 coreColor=mix(u_starColor,vec3(1.,.95,.8),.6);
        vec3 flameColor=mix(u_starColor*.5,coreColor,flamePattern+rim*.5);
        
        // High intensity output to feed your bloom pipeline
        float intensity=pow(flamePattern,1.5)*rim*u_luminosity*2.5;
        
        finalColor=vec4(flameColor*intensity,intensity*rim);
    }