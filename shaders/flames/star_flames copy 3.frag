#version 330

in vec3 fragPosition;
in vec3 fragNormal;
in vec2 fragTexCoord;
in float v_disp;

out vec4 finalColor;

uniform vec3 u_viewPos;
uniform vec3 u_starColor;
uniform float u_time;
uniform float u_luminosity;

// ============================================================================
// ⚙️ SOLAR FLAME SETTINGS ⚙️
// ============================================================================

// --- 1. SHAPE & EDGES ---
const float RIM_EXPONENT=2.5;// Higher = keeps center transparent, flames stick tightly to the edges.
const float DISP_FADE_START=.02;// The displacement height where flames start fading out.
const float DISP_FADE_END=.08;// The height where flames become completely invisible.

// --- 2. PLASMA TURBULENCE ---
const float PLASMA_SCALE=2.5;// Zoom level of the noise. Lower = massive flares.
const int FBM_OCTAVES=4;// Number of detail layers. 3 to 5 is best.
const float WARP_STRENGTH=2.;// How strongly the plasma twists and loops.

// --- 3. ANIMATION SPEED ---
const float FLOW_SPEED=.6;// Base rising speed of the plasma erupting outwards.
const float WARP_SPEED=1.2;// Speed of the twisting/swirling distortion effect.

// --- 4. COLOR & INTENSITY (DYNAMIC TO STAR COLOR) ---
const float BASE_COLOR_MIX=.7;// (0.0 - 1.0) How vivid the outer tips are. Higher = richer base color.
const float CORE_HEAT_MULTIPLIER=1.;// How much brighter the roots of the flames are compared to the tips.
const float CORE_WHITENESS=.2;// (0.0 - 1.0) How much the absolute hottest roots turn white. Keep low (0.1 - 0.3) to preserve blue/purple hues.
const float ALPHA_BOOST=2.5;// Multiplier for transparency.
const float LUMA_BOOST=1.;// Multiplier fed to your bloom pass.
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
        
        // Fresnel Rim
        float viewAngle=max(dot(V,N),0.);
        float rim=pow(1.-viewAngle,RIM_EXPONENT);
        
        // Plasma Coordinates & Flow
        vec3 pos=fragPosition*PLASMA_SCALE;
        float flow=u_time*FLOW_SPEED;
        
        // Domain Warping
        vec3 q=vec3(
            fbm(pos+vec3(0.,flow,0.)),
            fbm(pos+vec3(5.2,1.3,u_time*WARP_SPEED)),
            fbm(pos+vec3(1.8,8.4,0.))
        );
        float plasma=fbm(pos+WARP_STRENGTH*q);
        
        // Displacement Fade
        float dispFade=1.-smoothstep(DISP_FADE_START,DISP_FADE_END,v_disp);
        
        // Combine masks
        float flameAlpha=plasma*rim*dispFade*ALPHA_BOOST;
        flameAlpha=clamp(flameAlpha,0.,1.);
        
        // --- NEW DYNAMIC COLOR MATH ---
        // Outer flame tips use a slightly darker version of the true star color
        vec3 outerColor=u_starColor*BASE_COLOR_MIX;
        
        // The hot core blends the true star color slightly toward pure white, then multiplies brightness
        vec3 hotCore=mix(u_starColor,vec3(1.),CORE_WHITENESS)*CORE_HEAT_MULTIPLIER;
        
        // Mix them based on plasma density and height
        vec3 flameColor=mix(outerColor,hotCore,plasma*dispFade);
        
        // Apply lighting and alpha
        vec3 finalRGB=flameColor*u_luminosity*LUMA_BOOST*flameAlpha;
        
        finalColor=vec4(finalRGB,flameAlpha);
    }