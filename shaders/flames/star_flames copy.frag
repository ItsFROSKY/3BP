#version 330

in vec3 fragPosition;
in vec3 fragNormal;

out vec4 finalColor;

uniform vec3 u_viewPos;
uniform vec3 u_starColor;
uniform vec3 u_starPos;
uniform float u_starRadius;
uniform float u_time;
uniform float u_luminosity;

// ============================================================================
// VOLUMETRIC SOLAR FLAME SETTINGS
// ============================================================================
const int RAY_STEPS=16;// Raymarch quality (higher = smoother)
const float FLAME_HEIGHT=.45;// Height flames reach above surface (% of radius)
const float NOISE_SCALE=2.2;// Density of plasma arcs
const float FLOW_SPEED=.9;// Eruption velocity into space
const float BRIGHTNESS=3.;// Flame radiance multiplier for Bloom
const vec3 HOT_CORE_COLOR=vec3(1.,.95,.85);// Base heat color
// ============================================================================

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
    
    float fbm(vec3 p){
        float val=0.;
        float amp=.5;
        for(int i=0;i<3;i++){
            val+=amp*noise(p);
            p*=2.03;
            amp*=.5;
        }
        return val;
    }
    
    void main(){
        vec3 rayOrigin=u_viewPos;
        vec3 rayDir=normalize(fragPosition-u_viewPos);
        
        float R_inner=u_starRadius;
        float R_outer=u_starRadius*(1.+FLAME_HEIGHT);
        
        // Ray-Sphere intersection with outer flame shell
        vec3 oc=rayOrigin-u_starPos;
        float b=dot(oc,rayDir);
        float c=dot(oc,oc)-R_outer*R_outer;
        float h=b*b-c;
        
        if(h<0.)discard;
        
        float tNear=-b-sqrt(h);
        float tFar=-b+sqrt(h);
        
        if(tFar<0.)discard;
        tNear=max(tNear,0.);
        
        // Clip ray against inner star surface (don't raymarch inside the core)
        float cInner=dot(oc,oc)-R_inner*R_inner;
        float hInner=b*b-cInner;
        if(hInner>=0.){
            float tInner=-b-sqrt(hInner);
            if(tInner>0.){
                tFar=min(tFar,tInner);
            }
        }
        
        // Raymarching steps
        float stepSize=(tFar-tNear)/float(RAY_STEPS);
        vec3 accumulatedColor=vec3(0.);
        float accumulatedAlpha=0.;
        
        for(int i=0;i<RAY_STEPS;i++){
            float t=tNear+(float(i)+.5)*stepSize;
            vec3 pos=rayOrigin+t*rayDir;
            vec3 relPos=pos-u_starPos;
            float dist=length(relPos);
            vec3 normDir=relPos/dist;
            
            // Radial height [0.0 = surface, 1.0 = outer atmosphere boundary]
            float heightNorm=clamp((dist-R_inner)/(R_outer-R_inner),0.,1.);
            
            // Animate plasma outward along local radial vectors
            vec3 samplePos=normDir*(NOISE_SCALE*2.5)-normDir*(u_time*FLOW_SPEED);
            samplePos+=relPos*(NOISE_SCALE/R_inner);
            
            float n=fbm(samplePos);
            
            // Density falloff moving away from star surface
            float density=max(0.,n-heightNorm*.7)*(1.-heightNorm);
            
            if(density>.01){
                vec3 stepColor=mix(u_starColor,HOT_CORE_COLOR,density*1.2);
                float weight=density*stepSize*(BRIGHTNESS/u_starRadius);
                accumulatedColor+=stepColor*weight;
                accumulatedAlpha+=weight;
            }
        }
        
        accumulatedColor*=u_luminosity;
        accumulatedAlpha=clamp(accumulatedAlpha,0.,1.);
        
        finalColor=vec4(accumulatedColor,accumulatedAlpha);
    }