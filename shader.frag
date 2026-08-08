#version 330
in vec3 fragNormal;
in vec3 fragPosition;

uniform vec3 u_viewPos;
uniform vec3 u_starColor;

out vec4 outputColor;

// 3D Random Gradient Vector Generator
vec3 hashGrad(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// True 3D Perlin Gradient Noise with C2 Continuity
float perlinNoise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);

    // C2 quintic curve
    vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

    // Gradients and dot products at 8 corners
    float g000 = dot(hashGrad(i + vec3(0,0,0)), f - vec3(0,0,0));
    float g100 = dot(hashGrad(i + vec3(1,0,0)), f - vec3(1,0,0));
    float g010 = dot(hashGrad(i + vec3(0,1,0)), f - vec3(0,1,0));
    float g110 = dot(hashGrad(i + vec3(1,1,0)), f - vec3(1,1,0));
    float g001 = dot(hashGrad(i + vec3(0,0,1)), f - vec3(0,0,1));
    float g101 = dot(hashGrad(i + vec3(1,0,1)), f - vec3(1,0,1));
    float g011 = dot(hashGrad(i + vec3(0,1,1)), f - vec3(0,1,1));
    float g111 = dot(hashGrad(i + vec3(1,1,1)), f - vec3(1,1,1));

    // Trilinear interpolation
    return mix(
        mix(mix(g000, g100, u.x), mix(g010, g110, u.x), u.y),
        mix(mix(g001, g101, u.x), mix(g011, g111, u.x), u.y),
        u.z
    );
}

float fbm(vec3 p) {
    float total = 0.0;
}

void main(){
    vec3 V = normalize(u_viewPos-fragPosition);
    vec3 N = normalize(fragNormal);
    float dotV = max(dot(N,V), 0.0);
    float limb = sqrt(dotV);
    

    vec3 finalRGB = u_starColor*limb;
    outputColor = vec4(finalRGB, 1.0);
}