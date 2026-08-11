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

vec3 hash33(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return fract(sin(p) * 43758.5453123);
}

//Voronoi Cellular Noise for Solar Granulation
float voronoi3D(vec3 p) {
    vec3 g = floor(p);
    vec3 f = fract(p);
    float minDist = 1.0;

    for (int z = -1; z <= 1; z++) {
        for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
                vec3 lattice = vec3(x, y, z);
                vec3 offset = hash33(g + lattice);
                vec3 d = lattice + offset - f;
                float dist = length(d);
                minDist = min(minDist, dist);
            }
        }
    }
    //Invert so cell centers are 1.0 (bright) and borders are 0.0 (dark)
    return clamp(1.0 - minDist, 0.0, 1.0);
}

//Ridge Noise for magnetic filament Loops
float ridgeLoops(vec3 p) {
    float total = 0.0;
    float freq = 1.0;
    float amp = 0.5;

    for (int i = 0; i < 4; i++) {
        float n = 1.0 - abs(noise3D(p * freq));
        n = n*n*n; // Sharpen ridges
        total += n * amp;
        freq *= 2.2;
        amp *= 0.5;
    }
    return total;
}

float domainWrap(vec3 p, float time, float wrapStrength) {
    vec3 timeOffSet = vec3(0.0, time * 0.08, time * 0.04);
    vec3 factor = vec3(fbm(p + timeOffSet), fbm(p + vec3(5.2, 1.3, 2.8) + timeOffSet), fbm(p + vec3(1.7, 9.2, 3.4) + timeOffSet));

    float result = fbm(p + wrapStrength * factor);
    result = clamp((result / 0.6) * 0.5 + 0.5, 0.0, 1.0); // Normalize to [0,1]

    return result;
}

void main() {
    vec3 pos = fragLocalPos * 3.0;

    
    float baseClouds = domainWrap(pos, u_time, 2.2);

    // magnetic filaments
    vec3 loopPos = pos * 2.5 + vec3(u_time * 0.1, 0.0, u_time * 0.05);
    float filaments = ridgeLoops(loopPos);

    // VORONOI GRANULATION (Solar Convective Cells)
    // Scale position by 32.0 for fine cell resolution
    vec3 granPos = fragLocalPos * 32.0 + vec3(0.0, u_time * 0.15, 0.0);
    
    // Lower power exponent (1.4 instead of 1.8) makes cell borders wider and more visible
    float granules = pow(voronoi3D(granPos), 1.8);

    // COMBINE CELLULAR NOISE WITH BASE CLOUDS & FILAMENTS
    // Apply granules to baseClouds: cell centers brighten while borders etch dark channels
    float structuredBase = baseClouds * (0.55 + granules * 0.55);

    // Add filaments on top of structured cell surface
    float plasmaPattern = structuredBase * 0.6 + (filaments * structuredBase) * 0.7;
    plasmaPattern = clamp(plasmaPattern, 0.0, 1.0);

    // COLOR PALETTE & RAMP SETUP
    vec3 colDark  = u_starColor * 0.12; // Deep cell boundaries
    vec3 colOrign = u_starColor;

    vec3 maxColor = u_starColor / max(max(u_starColor.r, u_starColor.g), max(u_starColor.b, 0.001));
    vec3 colHot   = mix(colOrign, maxColor + vec3(0.4, 0.35, 0.1), 0.85);
    vec3 colPeak  = mix(maxColor * 2.0, vec3(2.2, 2.2, 2.2), 0.4);

    vec3 PlasmaCol = mix(colDark, colOrign, smoothstep(0.0, 0.35, plasmaPattern));
    PlasmaCol      = mix(PlasmaCol, colHot, smoothstep(0.35, 0.75, plasmaPattern));
    PlasmaCol      = mix(PlasmaCol, colPeak, smoothstep(0.82, 0.98, plasmaPattern));

    // LIMB & RIM GLOW
    vec3 V = normalize(u_viewPos - fragPosition);
    vec3 N = normalize(fragNormal);
    float dotV = max(dot(N, V), 0.0);
    float limb = pow(dotV, 0.4);

    float edgeFire = fbm(fragLocalPos * 12.0 - u_time * 0.25);
    float rim = pow(1.0 - dotV, 3.5) * (1.0 + edgeFire * 1.8);
    vec3 rimGlow = mix(u_starColor, colHot, 0.6) * rim;

    vec3 finalRGB = (PlasmaCol * limb) + rimGlow;
    outputColor = vec4(finalRGB, 1.0);
















  /*

    float plasmaPattren = domainWrap(pos, u_time, 2.2);

    // Add subtle high-frequency grain (scale 25.0)
    float grain = noise3D(fragLocalPos * 25.0 + vec3(0.0, u_time * 0.2, 0.0)) * 0.08;
    plasmaPattren = clamp(plasmaPattren + grain, 0.0, 1.0);

    vec3 colDark = (u_starColor * u_starColor) * 0.25;
    vec3 colOrign = u_starColor;
    vec3 colLow   = mix(colDark, colOrign, 0.45);
    vec3 maxColor = u_starColor / max(max(u_starColor.r, u_starColor.g), max(u_starColor.b, 0.001));
    vec3 colHot   = mix(maxColor, vec3(1.0, 1.0, 1.0), 0.45);
    vec3 colPeak = vec3(1.0,1.0,1.0);

    vec3 PlasmaCol = mix(colDark, colLow, smoothstep(0.18, 0.26, plasmaPattren));
    PlasmaCol = mix(PlasmaCol, colOrign, smoothstep(0.26, 0.35, plasmaPattren));
    PlasmaCol = mix(PlasmaCol, colHot, smoothstep(0.35, 0.9, plasmaPattren));
    PlasmaCol = mix(PlasmaCol, colPeak, smoothstep(0.9, 0.98, plasmaPattren));



    vec3 V = normalize(u_viewPos-fragPosition);
    vec3 N = normalize(fragNormal);
    float dotV = max(dot(N,V), 0.0);
    float limb = sqrt(dotV);
    

    vec3 finalRGB = PlasmaCol*limb;
    outputColor = vec4(finalRGB, 1.0); */
}