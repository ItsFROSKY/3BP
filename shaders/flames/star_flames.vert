#version 330

in vec3 vertexPosition;
in vec2 vertexTexCoord;
in vec3 vertexNormal;

uniform mat4 mvp;
uniform mat4 matModel;
uniform float u_time;

out vec3 fragPosition;
out vec3 fragNormal;
out vec3 fragLocalPos;
out float v_flame;

// ------------------------------------------------------------
// Stable hash / value noise
// ------------------------------------------------------------
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
                
                for(int i=0;i<4;++i)
                {
                    value+=noise(p)*amplitude;
                    p=p*2.+vec3(17.13,9.71,4.37);
                    amplitude*=.5;
                }
                
                return value;
            }
            
            void main()
            {
                vec3 dir=normalize(vertexPosition);
                
                // Large moving structures: these decide WHERE the star erupts.
                vec3 macroPos=dir*3.5;
                macroPos+=vec3(0.,u_time*.10,-u_time*.055);
                
                float macroA=fbm(macroPos);
                float macroB=fbm(dir*7.-vec3(u_time*.16,-u_time*.08,u_time*.12));
                
                // Convert broad noise into localized eruption zones.
                float eruption=smoothstep(.45,.74,macroA);
                eruption=pow(eruption,1.75);
                
                // Small-scale breakup prevents every eruption from looking like one blob.
                float breakup=smoothstep(.34,.72,macroB);
                
                // Fine animated surface turbulence.
                vec3 finePos=vertexPosition*18.
                +vec3(0.,-u_time*.75,u_time*.42);
                float fine=fbm(finePos);
                
                // Mostly calm surface, occasional tall plasma tongues.
                float displacement=.018
                +eruption*(.055+.15*breakup)
                +pow(max(fine-.42,0.),1.8)*.025;
                
                // Keep a compact dense base while allowing a small amount of explosive relief.
                displacement*=mix(.78,1.18,breakup);
                
                vec3 displacedPos=vertexPosition+dir*displacement;
                
                // This value is used by the fragment shader to know whether it is
                // looking at a quiet surface region or an active plasma tongue.
                v_flame=clamp(eruption*(.55+.75*breakup)+fine*.18,0.,1.);
                
                fragLocalPos=displacedPos;
                fragPosition=vec3(matModel*vec4(displacedPos,1.));
                fragNormal=normalize(mat3(matModel)*vertexNormal);
                
                gl_Position=mvp*vec4(displacedPos,1.);
            }
            