#version 330

// 1. INPUTS (From Raylib's Mesh Data)
in vec3 vertexPosition;
in vec3 vertexNormal;

// 2. OUTPUTS (Passed to shader.frag)
out vec3 fragPosition;
out vec3 fragNormal;
out vec3 fragLocalPos;
//flat out float star_distance_to_camera;

// 3. UNIFORMS (Provided automatically by Raylib)
uniform mat4 mvp;
uniform mat4 matModel;
uniform mat4 matNormal;
uniform vec3 u_viewPos;

// 4. MAIN FUNCTION
void main() {
    fragLocalPos = vertexPosition;
    fragPosition = vec3(matModel * vec4(vertexPosition, 1.0));
    fragNormal   = normalize(vec3(matNormal * vec4(vertexNormal, 0.0)));
    gl_Position  = mvp * vec4(vertexPosition, 1.0);
    /*vec3 starCenter = matModel[3].xyz;
    star_distance_to_camera = length(u_viewPos - starCenter);*/
}