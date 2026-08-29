// shaders/sky_background.frag
#version 330

in vec2 fragTexCoord;
out vec4 outputColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_cameraDir;// Camera forward vector passed from host application

// ============================================================================
// 1. GLOBAL CAMERA & ACES TONE MAPPING SETTINGS
// ============================================================================

// Camera exposure multiplier applied before ACES tone mapping (higher = brighter scene overall)
const float SCENE_EXPOSURE=1.10;

// Final gamma correction factor for realistic color display (2.2 standard for sRGB displays)
const float SCENE_GAMMA=2.20;

// ============================================================================
// 2. STAR FIELD SETTINGS
// ============================================================================

// Spatial density grids (higher = more densely packed star coordinates)
const float STAR_MAJOR_GRID_SCALE=45.;// Bright major star grid density
const float STAR_MICRO_GRID_SCALE=110.;// Distant faint micro star grid density

// Spawn thresholds (0.95 = top 5% of grid cells contain a star)
const float STAR_MAJOR_DENSITY=.955;
const float STAR_MICRO_DENSITY=.965;

// Light brightness multiplier for star layers
const float STAR_GLOBAL_BRIGHTNESS=1.80;

// Size bounds for stars (fraction of grid cell)
const float STAR_MIN_RADIUS=.04;
const float STAR_MAX_RADIUS=.28;
const float STAR_SIZE_DISTRIBUTION=3.5;// Higher values bias generation toward tiny stars

// Asynchronous Pulsation (Twinkle)
const float STAR_PULSE_AMPLITUDE=.35;// Depth of light modulation (0.0 = static, 0.5 = 50% brightness shift)
const float STAR_PULSE_SPEED=1.60;// Base pulse frequency multiplier

// ============================================================================
// 3. CYAN & PURPLE NEBULA GAS CLOUD SETTINGS
// ============================================================================

// Purple/Magenta Cosmic Cloud Settings
const float NEBULA_PURPLE_INTENSITY=.04;// Overall opacity/brightness of purple gas
const float NEBULA_PURPLE_SCALE=3.30;// Noise frequency (lower = larger broad cloud structures)
const float NEBULA_PURPLE_THRESHOLD=.5;// Density cutoff (higher = less sky coverage, sharper clouds)
const vec3 COLOR_PURPLE_BODY=vec3(.18,.02,.35);// Deep space violet core color
const vec3 COLOR_MAGENTA_HIGHLIGHT=vec3(.65,.08,.55);// Luminous magenta wisp color

// Cyan Ionized Fog Settings
const float NEBULA_CYAN_INTENSITY=.04;// Overall opacity/brightness of cyan fog
const float NEBULA_CYAN_SCALE=1.70;// Noise frequency for cyan gas
const float NEBULA_CYAN_THRESHOLD=.5;// Density cutoff for cyan fog
const vec3 COLOR_CYAN_BODY=vec3(0.,.38,.58);// Deep cyan gas color
const vec3 COLOR_CYAN_HIGHLIGHT=vec3(.08,.82,.92);// Electric teal highlight color

// ============================================================================
// 4. MULTI-GALAXY SPATIAL GRID & MORPHOTYPE SETTINGS
// ============================================================================

// Spatial distribution grid for galaxies across the sky sphere
const float GALAXY_GRID_DENSITY=1.2;// Higher = more spatial sectors dividing the sky
const float GALAXY_SPAWN_CHANCE=.5;// Probability of a sector spawning a galaxy (0.0 to 1.0)
const float GALAXY_GLOBAL_BRIGHTNESS=.06;// Master intensity multiplier for all galaxies

// Spawn Weights (Equalized at 0.20 to guarantee balanced distribution across all types)
const float WEIGHT_TYPE_SPIRAL=.145;// Type 0: Grand Design Spiral
const float WEIGHT_TYPE_BARRED=.145;// Type 1: Barred Spiral
const float WEIGHT_TYPE_ELLIPTICAL=.25;// Type 2: Smooth Elliptical
const float WEIGHT_TYPE_RING=.21;// Type 3: Ring / Lenticular
const float WEIGHT_TYPE_IRREGULAR=.25;// Type 4: Irregular Dwarf Galaxy

// Min and Max size bounds for galaxy sectors (randomized per instance)
const float GALAXY_MIN_RADIUS_SCALE=.0060;// Smallest galaxy disk scale
const float GALAXY_MAX_RADIUS_SCALE=.0180;// Largest galaxy disk scale
const float GALAXY_SIZE_BIAS_CURVE=3.5;// Size distribution curve

// Detailed Morphotype Parameters
const float SPIRAL_KNOT_BRIGHTNESS=1.40;// HII star-forming region intensity in spiral arms
const float BARRED_BAR_LENGTH=.42;// Center bar length for barred spirals
const float ELLIPTICAL_CORE_FALLOFF=3.80;// Radial sharpness of elliptical galaxies
const float RING_CORE_SIZE=.60;// Radius of outer ring in ring galaxies
const float IRREGULAR_CHAOS_FREQ=3.20;// Structural distortion frequency for irregular galaxies

// ============================================================================
// NOISE & UTILITY FUNCTIONS
// ============================================================================

float hash31(vec3 p){
    p=fract(p*vec3(443.897,441.423,437.195));
    p+=dot(p,p.yzx+19.19);
    return fract((p.x+p.y)*p.z);
}

vec3 hash33(vec3 p){
    p+=vec3(127.1,311.7,74.7);
    p=vec3(dot(p,vec3(127.1,311.7,74.7)),
    dot(p,vec3(269.5,183.3,246.1)),
    dot(p,vec3(113.5,271.9,124.6)));
    return fract(sin(p)*43758.5453123);
}

vec3 hashGrad(vec3 p){
    p=vec3(dot(p,vec3(127.1,311.7,74.7)),
    dot(p,vec3(269.5,183.3,246.1)),
    dot(p,vec3(113.5,271.9,124.6)));
    return normalize(-1.+2.*fract(sin(p)*43758.5453));
}

float noise3D(vec3 p){
    vec3 i=floor(p);
    vec3 f=fract(p);
    vec3 u=f*f*f*(f*(f*6.-15.)+10.);
    
    return mix(
        mix(mix(dot(hashGrad(i+vec3(0,0,0)),f-vec3(0,0,0)),
        dot(hashGrad(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),
        mix(dot(hashGrad(i+vec3(0,1,0)),f-vec3(0,1,0)),
        dot(hashGrad(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
        mix(mix(dot(hashGrad(i+vec3(0,0,1)),f-vec3(0,0,1)),
        dot(hashGrad(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),
        mix(dot(hashGrad(i+vec3(0,1,1)),f-vec3(0,1,1)),
        dot(hashGrad(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);
    }
    
    float fbm(vec3 p){
        float total=0.;
        float amp=.5;
        for(int i=0;i<4;i++){
            total+=amp*noise3D(p);
            p*=2.02;
            amp*=.5;
        }
        return total;
    }
    
    // ============================================================================
    // ACES FILM TONE MAPPING (Narkowicz ACES Fit)
    // Transforms raw HDR highlights into smooth, filmic optical roll-offs
    // ============================================================================
    
    vec3 acesFilm(vec3 x){
        float a=2.51;
        float b=.03;
        float c=2.43;
        float d=.59;
        float e=.14;
        return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.,1.);
    }
    
    // ============================================================================
    // NEBULA RENDER PIPELINE
    // ============================================================================
    
    vec3 computeNebulae(vec3 rayDir){
        // 1. Purple Gas Pass
        vec3 pPurp=rayDir*NEBULA_PURPLE_SCALE+vec3(142.3,u_time*.0015,-87.1);
        vec3 qPurp=vec3(fbm(pPurp),fbm(pPurp+vec3(3.1,8.2,1.4)),fbm(pPurp+vec3(7.2,1.1,4.3)));
        float rawPurp=fbm(pPurp+1.8*qPurp)*.5+.5;
        
        float cloudPurp=smoothstep(NEBULA_PURPLE_THRESHOLD,NEBULA_PURPLE_THRESHOLD+.35,rawPurp);
        vec3 purpleGas=mix(COLOR_PURPLE_BODY,COLOR_MAGENTA_HIGHLIGHT,pow(cloudPurp,1.5))*cloudPurp*NEBULA_PURPLE_INTENSITY;
        
        // 2. Cyan Fog Pass
        vec3 pCyan=rayDir*NEBULA_CYAN_SCALE+vec3(-91.5,u_time*.002,43.8);
        vec3 qCyan=vec3(fbm(pCyan),fbm(pCyan+vec3(5.2,1.3,2.8)),fbm(pCyan+vec3(1.7,9.2,3.4)));
        float rawCyan=fbm(pCyan+1.8*qCyan)*.5+.5;
        
        float cloudCyan=smoothstep(NEBULA_CYAN_THRESHOLD,NEBULA_CYAN_THRESHOLD+.35,rawCyan);
        vec3 cyanGas=mix(COLOR_CYAN_BODY,COLOR_CYAN_HIGHLIGHT,pow(cloudCyan,1.4))*cloudCyan*NEBULA_CYAN_INTENSITY;
        
        return purpleGas+cyanGas;
    }
    
    // ============================================================================
    // SINGLE GALAXY RENDERER WITH RANDOMIZED 3D ANGLES & SIZES
    // ============================================================================
    
    vec3 renderSingleGalaxy(vec3 rayDir,vec3 centerDir,vec3 cellHash){
        float cosAngle=dot(rayDir,centerDir);
        if(cosAngle<=.05)return vec3(0.);
        
        vec3 h2=hash33(cellHash*17.3+vec3(1.2,3.4,5.6));
        vec3 h3=hash33(cellHash*43.1+vec3(9.1,2.8,6.4));
        
        // Equalized Type Selection
        int galaxyType=0;
        float totalWeight=WEIGHT_TYPE_SPIRAL+WEIGHT_TYPE_BARRED+WEIGHT_TYPE_ELLIPTICAL+WEIGHT_TYPE_RING+WEIGHT_TYPE_IRREGULAR;
        float randTypeVal=h2.x*totalWeight;
        
        if(randTypeVal<WEIGHT_TYPE_SPIRAL)galaxyType=0;
        else if(randTypeVal<WEIGHT_TYPE_SPIRAL+WEIGHT_TYPE_BARRED)galaxyType=1;
        else if(randTypeVal<WEIGHT_TYPE_SPIRAL+WEIGHT_TYPE_BARRED+WEIGHT_TYPE_ELLIPTICAL)galaxyType=2;
        else if(randTypeVal<WEIGHT_TYPE_SPIRAL+WEIGHT_TYPE_BARRED+WEIGHT_TYPE_ELLIPTICAL+WEIGHT_TYPE_RING)galaxyType=3;
        else galaxyType=4;
        
        // Randomized Size Scaling
        float sizeInterpolant=pow(cellHash.y,GALAXY_SIZE_BIAS_CURVE);
        float chosenRadiusScale=mix(GALAXY_MIN_RADIUS_SCALE,GALAXY_MAX_RADIUS_SCALE,sizeInterpolant);
        
        // 3D Tangent Projection Plane
        vec3 normDir=normalize(centerDir);
        vec3 arbitraryUp=(abs(normDir.y)>.99)?vec3(1.,0.,0.):vec3(0.,1.,0.);
        vec3 gRight=normalize(cross(normDir,arbitraryUp));
        vec3 gUp=cross(gRight,normDir);
        
        // Completely Randomized Roll Angle (0 to 360 deg)
        float rollAngle=h2.y*6.2831853;
        vec3 rotatedRight=gRight*cos(rollAngle)+gUp*sin(rollAngle);
        vec3 rotatedUp=-gRight*sin(rollAngle)+gUp*cos(rollAngle);
        
        vec3 projRay=rayDir/cosAngle-normDir;
        vec2 gUV=vec2(dot(projRay,rotatedRight),dot(projRay,rotatedUp))/chosenRadiusScale;
        
        // Completely Randomized Tilt Angle (Pitch / View Angle)
        float tiltFactor=mix(.25,.90,h2.z);
        gUV.y/=tiltFactor;
        
        float r=length(gUV);
        
        // Smooth radial edge falloff mask (prevents box cropping)
        float discEdgeMask=smoothstep(1.,.50,r);
        if(discEdgeMask<=0.)return vec3(0.);
        
        float angle=atan(gUV.y,gUV.x);
        vec3 finalGalaxyColor=vec3(0.);
        
        // Realistic Star Colors
        vec3 coreColor=mix(vec3(1.,.88,.65),vec3(1.,.55,.25),h3.z);// Warm stellar core
        vec3 armColor=mix(vec3(.35,.65,.95),vec3(.20,.80,1.),h3.x);// Cool blue active star-forming arms
        
        if(galaxyType==0){
            // TYPE 0: GRAND DESIGN SPIRAL
            float numArms=(h2.z>.5)?2.:4.;
            float twistRate=mix(3.,5.,h3.y);
            float armDirection=(h3.x>.5)?1.:-1.;
            
            float spiral=sin((angle*armDirection)*numArms-log(r+.001)*twistRate);
            float coreBulge=exp(-r*4.)*2.8;
            float arms=exp(-r*2.2)*smoothstep(-.2,.7,spiral);
            
            float armKnotsNoise=noise3D(vec3(gUV*10.,h2.y*10.));
            float h2Regions=smoothstep(.55,.85,armKnotsNoise)*arms*SPIRAL_KNOT_BRIGHTNESS;
            vec3 knotColor=mix(vec3(.2,.85,1.),vec3(1.,.35,.70),h3.y);
            
            float dustNoise=fbm(vec3(gUV*4.5,h2.x*20.));
            float dustLanes=smoothstep(.42,.70,dustNoise)*exp(-r*1.8)*smoothstep(.08,.4,r);
            
            finalGalaxyColor=(coreColor*coreBulge+armColor*arms+knotColor*h2Regions)*(1.-dustLanes*.70);
            
        }else if(galaxyType==1){
            // TYPE 1: BARRED SPIRAL
            float barWidth=.09;
            float inBar=smoothstep(barWidth,0.,abs(gUV.y))*smoothstep(BARRED_BAR_LENGTH,0.,abs(gUV.x));
            
            float twistRate=mix(2.5,4.,h3.y);
            float spiral=sin(angle*2.-log(r+.001)*twistRate);
            float arms=exp(-r*2.)*smoothstep(-.1,.7,spiral)*smoothstep(.18,.38,r);
            float coreBulge=exp(-r*4.5)*2.5;
            
            vec3 barColor=mix(coreColor,armColor,.35);
            finalGalaxyColor=(coreColor*coreBulge+barColor*inBar*2.+armColor*arms);
            
        }else if(galaxyType==2){
            // TYPE 2: ELLIPTICAL GALAXY
            float ellipticalProfile=exp(-pow(r,.65)*ELLIPTICAL_CORE_FALLOFF);
            vec3 deepEllipticalColor=mix(coreColor,vec3(1.,.5,.2),.2);
            
            finalGalaxyColor=deepEllipticalColor*ellipticalProfile*3.;
            
        }else if(galaxyType==3){
            // TYPE 3: RING GALAXY
            float coreBulge=exp(-r*6.)*3.;
            float ringDist=abs(r-RING_CORE_SIZE);
            float ring=smoothstep(.14,0.,ringDist)*1.4;
            
            float ringTexture=noise3D(vec3(gUV*12.,cellHash.x));
            ring*=(.7+.5*ringTexture);
            
            finalGalaxyColor=(coreColor*coreBulge+armColor*ring);
            
        }else if(galaxyType==4){
            // TYPE 4: IRREGULAR DWARF
            vec3 distortedUV=vec3(gUV*2.5,h2.y*5.);
            float chaoticNoise=fbm(distortedUV+vec3(fbm(distortedUV*IRREGULAR_CHAOS_FREQ)));
            
            float clumpiness=smoothstep(0.,.6,chaoticNoise)*exp(-r*2.2);
            vec3 irregularColor=mix(armColor,vec3(.6,.9,1.),chaoticNoise);
            
            finalGalaxyColor=irregularColor*clumpiness*2.;
        }
        
        float depthFade=mix(.40,1.,sizeInterpolant);
        return finalGalaxyColor*discEdgeMask*depthFade*GALAXY_GLOBAL_BRIGHTNESS;
    }
    
    // ============================================================================
    // DENSE MULTI-GALAXY SPATIAL SECTORING ENGINE
    // ============================================================================
    
    vec3 computeGalaxies(vec3 rayDir){
        vec3 galaxyLight=vec3(0.);
        vec3 cell=floor(rayDir*GALAXY_GRID_DENSITY);
        
        for(int z=-3;z<3;z++){
            for(int y=-3;y<=3;y++){
                for(int x=-3;x<=3;x++){
                    vec3 neighborCell=cell+vec3(float(x),float(y),float(z));
                    vec3 cellHash=hash33(neighborCell);
                    
                    if(cellHash.x<GALAXY_SPAWN_CHANCE){
                        vec3 centerDir=normalize(neighborCell+cellHash-.5);
                        if(dot(rayDir,centerDir)<.78)continue;// Early angle culling optimization
                        
                        galaxyLight+=renderSingleGalaxy(rayDir,centerDir,cellHash);
                    }
                }
            }
        }
        return galaxyLight;
    }
    
    // ============================================================================
    // INDEPENDENT ASYNCHRONOUS STAR PULSE ENGINE
    // ============================================================================
    
    float starField3D(vec3 rayDir,float scale,float threshold){
        vec3 p=rayDir*scale;
        vec3 id=floor(p);
        vec3 gv=fract(p)-.5;
        
        float cellHash=hash31(id);
        if(cellHash>threshold){
            float dist=length(gv);
            
            float rawSize=(cellHash-threshold)/(1.-threshold);
            float biasedSize=mix(STAR_MIN_RADIUS,STAR_MAX_RADIUS,pow(rawSize,STAR_SIZE_DISTRIBUTION));
            
            // Completely asynchronous twinkle phase and speed derived from unique cell hash
            float uniquePhaseShift=hash31(id+vec3(7.3,1.9,4.1))*6.2831853;
            float uniqueSpeedMultiplier=mix(.4,2.2,hash31(id+vec3(2.1,8.4,1.2)))*STAR_PULSE_SPEED;
            
            float starTwinkle=1.+sin(u_time*uniqueSpeedMultiplier+uniquePhaseShift)*STAR_PULSE_AMPLITUDE;
            
            return smoothstep(biasedSize,0.,dist)*starTwinkle;
        }
        return 0.;
    }
    
    // ============================================================================
    // MAIN PIPELINE WITH ACES TONE MAPPING
    // ============================================================================
    
    void main(){
        vec3 forward=(length(u_cameraDir)<.001)?vec3(0.,0.,-1.):normalize(u_cameraDir);
        
        vec3 worldUp=(abs(forward.y)>.99)?vec3(0.,0.,1.):vec3(0.,1.,0.);
        vec3 right=normalize(cross(forward,worldUp));
        vec3 up=cross(right,forward);
        
        vec2 screenUV=(gl_FragCoord.xy-.5*u_resolution)/max(u_resolution.y,1.);
        vec3 rayDir=normalize(forward+screenUV.x*right+screenUV.y*up);
        
        // Cumulative HDR Color Buffer
        vec3 hdrColor=vec3(0.);
        
        // 1. Render Background Gas & Nebulae
        hdrColor+=computeNebulae(rayDir);
        
        // 2. Render Un-cropped Galaxies
        hdrColor+=computeGalaxies(rayDir);
        
        // 3. Render Stars
        float majorStars=starField3D(rayDir,STAR_MAJOR_GRID_SCALE,STAR_MAJOR_DENSITY);
        float microStars=starField3D(rayDir+vec3(17.1),STAR_MICRO_GRID_SCALE,STAR_MICRO_DENSITY)*.4;
        
        vec3 starRGB=vec3(majorStars+microStars);
        vec3 tintedStars=mix(starRGB*vec3(.75,.88,1.),starRGB*vec3(1.,.85,.65),hash31(floor(rayDir*STAR_MAJOR_GRID_SCALE)));
        
        hdrColor+=tintedStars*STAR_GLOBAL_BRIGHTNESS;
        
        // 4. Filmic ACES Tone Mapping Pass & Gamma Correction
        vec3 ldrColor=acesFilm(hdrColor*SCENE_EXPOSURE);
        ldrColor=pow(ldrColor,vec3(1./SCENE_GAMMA));
        
        outputColor=vec4(ldrColor,1.);
    }