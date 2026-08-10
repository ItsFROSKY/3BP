#version 330
in vec3 fragNormal;
in vec3 fragPosition;
in vec3 fragLocalPos;

uniform vec3 u_viewPos;
uniform vec3 u_starColor;
uniform float u_time;

out vec4 outputColor;

// 3D Random Gradient Vector Generator
vec3 hashGrad(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return normalize(-1.0 + 2.0 * fract(sin(p) * 43758.5453123));
}

// True 3D Perlin Gradient Noise with C2 Continuity
float noise3D(vec3 p) {
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
    float freq = 1.0;
    float amp = 0.5;

    for (int i =0; i < 5; i++) {
        total += amp*noise3D(p*freq);
        amp *= 0.5;
        freq *= 2.0;
    }
    return total;
}

float domainWrap(vec3 p, float time, float wrapStrength) {
    vec3 timeOffSet = vec3(0.0, time * 0.08, time * 0.04);
    vec3 factor = vec3(fbm(p + timeOffSet), fbm(p + vec3(5.2, 1.3, 2.8) + timeOffSet), fbm(p + vec3(1.7, 9.2, 3.4) + timeOffSet));

    float result = fbm(p + wrapStrength * factor);
    result = clamp((result / 0.6) * 0.5 + 0.5, 0.0, 1.0); // Normalize to [0,1]

    // Sample final noise pattern at distorted coordinate space
    return result;
}

void main(){
    vec3 pos = fragLocalPos*3.0;
    float plasmaPattren = domainWrap(pos, u_time, 2.0);

    // Add subtle high-frequency grain (scale 25.0)
    float grain = noise3D(fragLocalPos * 25.0 + vec3(0.0, u_time * 0.2, 0.0)) * 0.08;
    plasmaPattren = clamp(plasmaPattren + grain, 0.0, 1.0);

    vec3 colDark = u_starColor*u_starColor*0.001;
    vec3 colOrign = u_starColor;
    vec3 colHot  = mix(u_starColor, vec3(1.0, 1.0, 1.0), 0.65);
    vec3 colPeak = vec3(1.0,1.0,1.0);

    vec3 PlasmaCol = mix(colDark, colOrign, smoothstep(0.0, 0.35, plasmaPattren));
    PlasmaCol = mix(PlasmaCol, colHot, smoothstep(0.35, 0.7, plasmaPattren));
    PlasmaCol = mix(PlasmaCol, colPeak, smoothstep(0.7, 0.95, plasmaPattren));



    vec3 V = normalize(u_viewPos-fragPosition);
    vec3 N = normalize(fragNormal);
    float dotV = max(dot(N,V), 0.0);
    float limb = sqrt(dotV);
    

    vec3 finalRGB = PlasmaCol*limb;
    outputColor = vec4(finalRGB, 1.0);
}