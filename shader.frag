#version 330
in vec3 fragNormal;
in vec3 fragPosition;

uniform vec3 u_viewPos;
uniform vec3 u_starColor;

out vec4 outputColor;

void main(){
    vec3 V = normalize(u_viewPos-fragPosition);
    vec3 N = normalize(fragNormal);
    float dotV = max(dot(N,V), 0.0);
    float limb = sqrt(dotV);
    

    vec3 finalRGB = u_starColor*limb;
    outputColor = vec4(finalRGB, 1.0);
}