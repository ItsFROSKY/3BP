#version 330
in vec3 fragNormal;
in vec3 fragPosition;
in vec3 fragLocalPos;
//flat in float star_distance_to_camera;

uniform vec3 u_viewPos;
uniform vec3 u_starColor;       // Color fallback / base override tint
uniform vec3 u_blackbodyColor;  // CPU-precomputed Blackbody RGB base
uniform float u_time;
uniform float u_luminosity;     // HDR scale factor (e.g. 10.0)

out vec4 outputColor;

//C2 continuous interpolation function
/*float smootherstep(float edge0, float edge1, float x) {
    x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}*/

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
    float g010 = dot(hashGrad(i + vec3(0,0,1)), f - vec3(0,1,0)); // fixed lookup index
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

    for (int i = 0; i < 5; i++) {
        total += amp * noise3D(p * freq);
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

    for (int i = 0; i < 5; i++) {
        float n = 1.0 - abs(noise3D(p * freq));
        n = pow(n, 3.0); // Sharpen ridges
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

// Procedural Sunspots (Umbra & Penumbra Mask)
float getSunspotMask(vec3 p, float time) {
    vec3 spotPos = p * 1.8 + vec3(time * 0.01, 0.0, time * 0.005);
    float n = fbm(spotPos);
    
    float penumbra = smoothstep(0.55, 0.68, n);
    float umbra    = smoothstep(0.68, 0.78, n);

    float mask = mix(1.0, 0.55, penumbra);
    mask = mix(mask, 0.15, umbra);
    return mask;
}

void main() {

    // 3.0 is the scale factor, smaller values make patterns bigger, larger values make them smaller
    vec3 pos = fragLocalPos * 3.0 + vec3(0.0, u_time * 0.1, 0.0);
    // 25.0 is the wrap strength, Higher values makes whirlpool patterns; lower values make clouds smooth and uniform
    float baseClouds = domainWrap(pos, u_time, 25.0);

    // magnetic filaments
    vec3 loopPos = pos * 100.0 + vec3(u_time * 0.1, 0.0, u_time * 0.05);
    float filaments = ridgeLoops(loopPos);

    // VORONOI GRANULATION (Solar Convective Cells)
    // Scale position by 50.0 for fine cell resolution, higher values make cells smaller aka they blend less, lower values make them larger aka they blend more, like fluids
    vec3 granPos = fragLocalPos * 50.0 + vec3(0.0, u_time * 0.15, 0.0);
    
    // small power exponent makes shader more bright, higher exponent makes it more dark
    float granules = pow(voronoi3D(granPos), 1.8);

    float structuredBase = baseClouds * (0.55 + granules * 1.0);

    // Add filaments on top of structured cell surface
    float plasmaPattern = structuredBase * 0.6 + (filaments * structuredBase) * 0.7;
    plasmaPattern = clamp(plasmaPattern, 0.0, 1.0);

    // COLOR PALETTE & RAMP SETUP (Driven by CPU Blackbody Uniform u_blackbodyColor)
    vec3 baseColor = (length(u_blackbodyColor) > 0.001) ? u_blackbodyColor : u_starColor;

    vec3 colDark  = baseColor * 0.05; // Deep cell boundaries
    vec3 colOrign = baseColor;

    vec3 maxColor = baseColor / max(max(baseColor.r, baseColor.g), max(baseColor.b, 0.001));
    vec3 colHot   = mix(colOrign, maxColor + vec3(0.4, 0.35, 0.1), 0.85);
    vec3 colPeak  = mix(maxColor * 4.0, vec3(2.2, 2.2, 2.2), 0.4);

    // Numbers represent the color palette ratios, how often each color appears in the final plasma pattern
    vec3 PlasmaCol = mix(colDark, colOrign, smoothstep(0.25, 0.4, plasmaPattern));
    PlasmaCol = mix(PlasmaCol, colHot, smoothstep(0.4, 0.75, plasmaPattern));
    PlasmaCol = mix(PlasmaCol, colPeak, smoothstep(0.75, 0.98, plasmaPattern));

    // Apply Sunspots (Umbra/Penumbra Suppression)
    PlasmaCol *= getSunspotMask(fragLocalPos, u_time);

    // LIMB & RIM GLOW
    vec3 V = normalize(u_viewPos - fragPosition);
    vec3 N = normalize(fragNormal);
    float dotV = max(dot(N, V), 0.0);
    float limb = pow(dotV, 0.9); // Adjust limb darkening exponent for more realistic effect

    float edgeFire = fbm(fragLocalPos * 100.0 - u_time * 1.0);
    float sizeRim = 5.0; // Adjust this value to control the size of the outer atmosphere rim glow, bigger values make rim more thin and sharper, smaller values make it thicker and more diffuse
    float rim = pow(1.0 - dotV, sizeRim) * (1.0 + edgeFire * 1.8);
    // 0.6 is the rim glow intensity, you can adjust it to make the rim glow more or less intense, aka more means closer to the star color, less means closer to the hot color
    vec3 rimGlow = mix(baseColor, colHot, 0.6) * rim;

    vec3 finalRGB = (PlasmaCol * limb) + rimGlow;
    
    // Output Unclipped HDR Radiance
    outputColor = vec4(finalRGB * u_luminosity, 1.0);
}