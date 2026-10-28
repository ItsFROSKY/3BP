#version 330

in vec3 vertexPosition;
in vec3 vertexNormal;

uniform mat4 mvp;
uniform mat4 matModel; 
uniform float u_shellScale;

out vec3 fragNormal;
out vec3 fragWorldPos;

void main() {
    vec3 scaledPos = vertexPosition + (vertexNormal * u_shellScale);
   
    fragWorldPos = vec3(matModel * vec4(scaledPos, 1.0));
    

    fragNormal = normalize(mat3(matModel) * vertexNormal);
    
    gl_Position = mvp * vec4(scaledPos, 1.0);
}