#version 330

in vec3 fragPosition;
in vec3 fragNormal;
in vec2 fragTexCoord;

out vec4 finalColor;

uniform vec3 u_viewPos;
uniform vec3 u_starColor;
uniform float u_time;
uniform float u_luminosity;

// ============================================================================
// PLASMA & FLAME SHADER SETTINGS (Edit directly in GLSL)
// ============================================================================
// Rim & Fresnel Setup
const float RIM_EXPONENT=2.;// Sharpness of silhouette rim (higher = thinner rim line)
const float RIM_WEIGHT=.5;// Influence of rim on overall flame brightness

// Plasma Noise & Domain Warping
const float PLASMA_SCALE=2.5;// Scale of surface liquid patterns (higher = finer detail)
const float WARP_STRENGTH=4.;// Turbulence intensity (higher = more chaotic swirls)
const float SPEED_LAYER_1=.4;// Primary plasma motion speed
const float SPEED_LAYER_2=.3;// Secondary domain warp swirl speed
const float SPEED_LAYER_3=.5;// Turbulent micro-detail speed
const int FBM_OCTAVES=4;// Noise depth layers (1-6; 4 is ideal performance/detail)

// Color & Intensity Tuning
const vec3 CORE_HOT_TINT=vec3(1.,.95,.8);// Color of extreme heat at center
const float CORE_HEAT_MIX=.6;// How strongly hot white/yellow overrides star color
const float DARK_OUTER_FACTOR=.5;// Darkening of outer flame tips
const float INTENSITY_POWER=1.5;// Flame contrast (higher = sharper bright spots)
const float INTENSITY_MULTIPLIER=2.5;// Overall brightness multiplier fed into Bloom pass
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
        for(int i=0;i<FBM_OCTAVES;i++){
            val+=amp*noise(p);
            p*=2.02;
            amp*=.5;
        }
        return val;
    }
    
    void main(){
        vec3 N=normalize(fragNormal);
        vec3 V=normalize(u_viewPos-fragPosition);
        
        // Fresnel rim factor calculation
        float rim=1.-max(dot(V,N),0.);
        rim=pow(rim,RIM_EXPONENT);
        
        // Iterative domain warping (fluid plasma simulation)
        vec3 p=fragPosition*PLASMA_SCALE;
        vec3 q=vec3(fbm(p+vec3(0.,u_time*SPEED_LAYER_1,0.)),
        fbm(p+vec3(5.2,1.3,u_time*SPEED_LAYER_2)),
        fbm(p+vec3(1.9,8.4,0.)));
        
        vec3 r=vec3(fbm(p+WARP_STRENGTH*q+vec3(1.7,9.2,u_time*SPEED_LAYER_3)),
        fbm(p+WARP_STRENGTH*q+vec3(8.3,2.8,u_time*SPEED_LAYER_2)),
        fbm(p+WARP_STRENGTH*q+vec3(2.5,4.1,0.)));
        
        float flamePattern=fbm(p+WARP_STRENGTH*r);
        
        // Color gradient setup
        vec3 coreColor=mix(u_starColor,CORE_HOT_TINT,CORE_HEAT_MIX);
        vec3 flameColor=mix(u_starColor*DARK_OUTER_FACTOR,coreColor,flamePattern+rim*RIM_WEIGHT);
        
        // Brightness boost for bloom extraction
        float intensity=pow(flamePattern,INTENSITY_POWER)*rim*u_luminosity*INTENSITY_MULTIPLIER;
        
        finalColor=vec4(flameColor*intensity,intensity*rim);
    }