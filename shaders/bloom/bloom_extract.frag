#version 330
in vec2 fragTexCoord;
uniform sampler2D texture0;
uniform float u_threshold; // Default: 1.0

out vec4 outputColor;

void main() {
    vec3 color = texture(texture0, fragTexCoord).rgb;
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    
    if (luminance > u_threshold) {
        outputColor = vec4(color, 1.0);
    } else {
        outputColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}