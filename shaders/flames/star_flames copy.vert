#version 330

in vec3 vertexPosition;
in vec2 vertexTexCoord;
in vec3 vertexNormal;

uniform mat4 mvp;
uniform mat4 matModel;
uniform float u_time;

out vec3 fragPosition;
out vec3 fragNormal;
out vec2 fragTexCoord;
out float v_disp;

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
    
    void main(){
        // Subtle outward wisp displacement (~0.08 scale limit)
        vec3 p=vertexPosition*3.+vec3(0.,u_time*.8,0.);
        float d1=noise(p);
        float d2=noise(p*2.5-vec3(0.,u_time*1.2,0.))*.5;
        v_disp=(d1+d2)*.08;
        
        vec3 displacedPos=vertexPosition+vertexNormal*v_disp;
        
        fragPosition=vec3(matModel*vec4(displacedPos,1.));
        fragNormal=normalize(mat3(matModel)*vertexNormal);
        fragTexCoord=vertexTexCoord;
        
        gl_Position=mvp*vec4(displacedPos,1.);
    }