#version 330
in vec2 fragTexCoord;
uniform sampler2D texture0;
uniform float u_renderHeight;

out vec4 outputColor;

const float weights[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

void main() {
    vec2 tex_offset = vec2(0.0, 1.0 / u_renderHeight);
    vec3 result = texture(texture0, fragTexCoord).rgb * weights[0];
    
    for (int i = 1; i < 5; ++i) {
        result += texture(texture0, fragTexCoord + vec2(0.0, tex_offset.y * float(i))).rgb * weights[i];
        result += texture(texture0, fragTexCoord - vec2(0.0, tex_offset.y * float(i))).rgb * weights[i];
    }
    outputColor = vec4(result, 1.0);
}