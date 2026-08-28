#version 330
in vec2 fragTexCoord;

uniform sampler2D u_hdrScene;
uniform sampler2D u_bloomBlur;
uniform int u_toneMapMode;       // 0: Reinhard, 1: ACES Film
uniform float u_bloomIntensity;  // Default: 1.2
uniform float u_exposure;        // Default: 1.0

out vec4 outputColor;

vec3 toneMapReinhard(vec3 color) {
    return color / (color + vec3(1.0));
}

vec3 toneMapACES(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// 4-star diffraction spike filter (telescope artifact)
vec3 computeDiffractionSpikes(sampler2D tex, vec2 uv) {
    vec3 spike = vec3(0.0);
    vec2 step = vec2(0.0025, 0.0025);
    for (int i = -4; i <= 4; i++) {
        if (i == 0) continue;
        spike += texture(tex, uv + vec2(float(i) * step.x, float(i) * step.y)).rgb * 0.04;
        spike += texture(tex, uv + vec2(float(i) * step.x, -float(i) * step.y)).rgb * 0.04;
    }
    return spike;
}

void main() {
    vec3 hdrColor = texture(u_hdrScene, fragTexCoord).rgb;
    vec3 bloomColor = texture(u_bloomBlur, fragTexCoord).rgb;
    vec3 spikeColor = computeDiffractionSpikes(u_bloomBlur, fragTexCoord);

    vec3 combined = hdrColor + (bloomColor * u_bloomIntensity) + (spikeColor * 0.4);
    combined *= u_exposure;

    vec3 mapped = (u_toneMapMode == 1) ? toneMapACES(combined) : toneMapReinhard(combined);

    outputColor = vec4(mapped, 1.0);
}