#version 330

// 1. INPUTS (From Raylib's Mesh Data)
in vec3 vertexPosition;
in vec3 vertexNormal;

// 2. OUTPUTS (Passed to shader.frag)
out vec3 fragPosition;
out vec3 fragNormal;

// 3. UNIFORMS (Provided automatically by Raylib)
uniform mat4 mvp;
uniform mat4 matModel;
uniform mat4 matNormal;

// 4. MAIN FUNCTION
void main() {
    fragPosition = vec3(matModel * vec4(vertexPosition, 1.0));
    fragNormal   = normalize(vec3(matNormal * vec4(vertexNormal, 0.0)));
    gl_Position  = mvp * vec4(vertexPosition, 1.0);
}