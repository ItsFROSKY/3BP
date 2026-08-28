#version 330
in vec3 fragNormal;
in vec3 fragLocalPos;

uniform vec3 u_viewPos;
uniform vec3 u_blackbodyColor;
uniform float u_luminosity;
uniform float u_time;

out vec4 outputColor;

vec3 hashGrad(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return normalize(-1.0 + 2.0 * fract(sin(p) * 43758.5453123));
}

float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(
        mix(mix(dot(hashGrad(i + vec3(0,0,0)), f - vec3(0,0,0)), dot(hashGrad(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
            mix(dot(hashGrad(i + vec3(0,1,0)), f - vec3(0,1,0)), dot(hashGrad(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
        mix(mix(dot(hashGrad(i + vec3(0,0,1)), f - vec3(0,0,1)), dot(hashGrad(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
            mix(dot(hashGrad(i + vec3(0,1,1)), f - vec3(0,1,1)), dot(hashGrad(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
}

void main() {
    vec3 N = normalize(fragNormal);
    vec3 V = normalize(u_viewPos - fragLocalPos);
    float dotV = max(dot(N, V), 0.0);

    float rim = pow(1.0 - dotV, 2.2);
    vec3 wispPos = fragLocalPos * 5.0 + vec3(0.0, u_time * 0.2, u_time * 0.1);
    float wisps = noise3D(wispPos) * 0.5 + 0.5;

    float alpha = rim * wisps;
    vec3 color = u_blackbodyColor * 1.5 + vec3(0.1, 0.05, 0.0);

    outputColor = vec4(color * alpha * u_luminosity * 0.4, alpha);
}