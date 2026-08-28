#version 330
in vec3 vertexPosition;
in vec3 vertexNormal;

uniform mat4 mvp;
uniform float u_shellScale;

out vec3 fragNormal;
out vec3 fragLocalPos;

void main() {
    fragNormal = vertexNormal;
    fragLocalPos = vertexPosition * u_shellScale;
    gl_Position = mvp * vec4(vertexPosition * u_shellScale, 1.0);
}