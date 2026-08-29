#version 330

in vec3 fragPosition;
in vec3 fragNormal;
in vec3 fragLocalPos;
in float v_flame;

out vec4 finalColorWide;

uniform vec3 u_viewPos;
uniform vec3 u_starColor;
uniform float u_time;
uniform float u_luminosity;

// ------------------------------------------------------------
// Flame character
// ------------------------------------------------------------
const float MACRO_SCALE=.8;
const float DETAIL_SCALE=19.;
const float FILAMENT_SCALE=46.;
const float FLOW_SPEED=.001;
const float Rim_surface=3;

const float Dark_level=2.5;

float hash(vec3 p)
{
    p=fract(p*vec3(443.897,441.423,437.195));
    p+=dot(p,p.yzx+19.19);
    return fract((p.x+p.y)*p.z);
}

float noise(vec3 p)
{
    vec3 i=floor(p);
    vec3 f=fract(p);
    f=f*f*(3.-2.*f);
    
    return mix(
        mix(
            mix(hash(i),hash(i+vec3(1,0,0)),f.x),
            mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
            mix(
                mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
            }
            
            float fbm(vec3 p)
            {
                float value=0.;
                float amplitude=.5;
                
                for(int i=0;i<5;++i)
                {
                    value+=noise(p)*amplitude;
                    p=p*2.+vec3(11.7,3.1,7.9);
                    amplitude*=.5;
                }
                
                return value;
            }
            
            // Sharpened noise gives thin magnetic-looking filaments.
            float filamentNoise(vec3 p)
            {
                float n=noise(p);
                n=1.-abs(n*2.-1.);
                return pow(max(n,0.),5.);
            }
            
            void main()
            {
                vec3 N=normalize(fragNormal);
                vec3 V=normalize(u_viewPos-fragPosition);
                
                float ndv=max(dot(N,V),0.);
                float rim=1.-ndv+Rim_surface;
                float old_rim=1.-ndv;
                float old_rim_transp=pow(old_rim,mix(10,1,smoothstep(0,1,old_rim)));
                
                // --------------------------------------------------------
                // 1. Broad plasma motion
                // --------------------------------------------------------
                vec3 P=fragLocalPos;
                vec3 flow=vec3(0.,u_time*FLOW_SPEED,-u_time*FLOW_SPEED*.55);
                
                // Domain-style warp: large clouds are bent by smaller clouds.
                vec3 warp;
                warp.x=fbm(P*2.6+flow);
                warp.y=fbm(P*3.1+flow+vec3(7.2,2.4,5.7));
                warp.z=fbm(P*2.4+flow+vec3(3.8,8.1,1.6));
                
                vec3 warpedP=P*MACRO_SCALE+(warp-.5)*2.4;
                
                float macro=fbm(warpedP+flow*.45);
                float secondary=fbm(P*8.-flow*1.35);
                
                // --------------------------------------------------------
                // 2. Filament layer
                // --------------------------------------------------------
                vec3 filamentP=P*FILAMENT_SCALE
                +vec3(0.,-u_time*2.2,u_time*1.15);
                
                float filaments=filamentNoise(filamentP);
                filaments+=.55*filamentNoise(filamentP*.55+13.);
                filaments=clamp(filaments,0.,1.);
                
                // --------------------------------------------------------
                // 3. Combine into uneven plasma density
                // --------------------------------------------------------
                float turbulence=macro*.58+secondary*.26+filaments*.42+v_flame*.48;
                
                turbulence=clamp(turbulence,0.,1.);
                
                // Distinct burning structures instead of an even cloudy shell.
                float fire=smoothstep(.38,.76,turbulence);
                fire*=smoothstep(.05,.55,v_flame+.15);
                
                // Quiet regions almost disappear, active regions stay dense.
                float broken=smoothstep(.16,.62,secondary);
                float density=fire*mix(.28,1.,broken);
                
                // --------------------------------------------------------
                // 4. Stronger plasma at the limb
                // --------------------------------------------------------
                // Very thin at the front-facing surface, strongest near silhouette.
                float limb=pow(rim,Dark_level);
                
                // Extra breakup on the silhouette prevents a perfect smooth ring.
                float edgeNoise=fbm(P*30.-vec3(0.,u_time*1.8,u_time*.65));
                float edgeBreakup=smoothstep(.30,.78,edgeNoise);
                
                float flameMask=density*limb;
                flameMask*=mix(.42,1.30,edgeBreakup);
                flameMask*=mix(.55,1.25,v_flame);
                flameMask=clamp(flameMask,0.,1.);
                
                // Fine transparency holes create a gaseous / turbulent appearance.
                float holes=smoothstep(.22,.60,filamentNoise(P*31.+flow*2.));
                flameMask*=mix(.72,1.,holes);
                
                // --------------------------------------------------------
                // 5. Heat color ramp
                // --------------------------------------------------------
                vec3 baseColor=u_starColor*.1;
                
                // Hot material tends toward white near dense regions.
                vec3 hotColor=baseColor*1.4;
                
                // Keep the outer material more saturated without forcing every star red.
                vec3 warmColor=mix(hotColor,baseColor,.28);
                
                float heat=clamp(
                    fire*.58
                    +v_flame*.52
                    +filaments*.22,
                0.,1.);
                
                vec3 flameColor=mix(warmColor,baseColor,smoothstep(.18,.46,heat));
                flameColor=mix(flameColor,hotColor,smoothstep(.48,.88,heat));
                
                // A tiny white-hot accent makes dense knots feel incandescent.
                float hotKnot=pow(clamp(heat,0.,1.),5.);
                flameColor=mix(flameColor,vec3(1.),hotKnot*.08);
                
                // --------------------------------------------------------
                // 6. HDR output
                // --------------------------------------------------------
                float intensity=flameMask*(.65+1.05*v_flame);
                
                finalColorWide=vec4(flameColor*intensity*u_luminosity,flameMask*.75);
            }
            