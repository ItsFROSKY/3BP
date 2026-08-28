#version 330
in vec2 fragTexCoord;
out vec4 outputColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_cameraDir; // 3D direction vector passed from C++

// USER CONFIGURABLE SETTINGS & TWEAKS
const float STAR_MAJOR_SCALE    = 5.0;  // Grid density for major stars (higher = smaller cells)
const float STAR_MAJOR_DENSITY  = 0.96;  // Spawn threshold for major stars (0.96 = top 4% of cells spawn a star)
const float STAR_MICRO_SCALE    = 110.0; // Grid density for distant micro stars
const float STAR_MICRO_DENSITY  = 0.97;  // Spawn threshold for micro stars
const float STAR_BRIGHTNESS     = 1.5;   // Global brightness multiplier for all stars

const float NEBULA_BRIGHTNESS   = 1.0;   // Luminosity of deep space nebulae
const float NEBULA_SCALE        = 2.5;   // Zoom level of gas noise patterns (higher = finer detail)
const float NEBULA_CUTOFF_LOW   = 0.05;  // Low density threshold (gas transparency start)
const float NEBULA_CUTOFF_HIGH  = 0.6;  // High density threshold (gas saturation limit)

const float GALAXY_SCALE        = 14.0;  // Angular scale (higher = smaller galaxy on screen)
const float GALAXY_BRIGHTNESS   = 0.8;   // Intensity of spiral arms and core
const float GALAXY_FOV_BOUND    = 0.94;  // Cosine of bounding angle (higher = tighter crop)

// --- 3D NOISE & HASH UTILITIES ---
// Pseudo-random float generator based on dot products
float hash31(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195)); // Large prime multipliers to break repetition
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
}

// Pseudo-random 3D unit gradient vector generator
vec3 hashGrad(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return normalize(-1.0 + 2.0 * fract(sin(p) * 43758.5453)); // Outputs vector in range [-1, 1]
}

// 3D Perlin Gradient Noise with Quintic Interpolation
float noise3D(vec3 p) {
    vec3 i = floor(p); // Cell index
    vec3 f = fract(p); // Local position inside cell (0.0 to 1.0)
    vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0); // C2 quintic smooth curve

    // Interpolate dot products between corner gradients and distance vectors
    return mix(
        mix(mix(dot(hashGrad(i + vec3(0,0,0)), f - vec3(0,0,0)),
                dot(hashGrad(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
            mix(dot(hashGrad(i + vec3(0,1,0)), f - vec3(0,1,0)),
                dot(hashGrad(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
        mix(mix(dot(hashGrad(i + vec3(0,0,1)), f - vec3(0,0,1)),
                dot(hashGrad(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
            mix(dot(hashGrad(i + vec3(0,1,1)), f - vec3(0,1,1)),
                dot(hashGrad(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
}

// Fractional Brownian Motion (4 octaves of layered noise)
float fbm(vec3 p) {
    float total = 0.0;
    float amp = 0.5; // Amplitude starts at 50%
    for (int i = 0; i < 4; i++) {
        total += amp * noise3D(p);
        p *= 2.02;  // Lacunarity (frequency multiplier per octave)
        amp *= 0.5; // Gain (amplitude attenuation per octave)
    }
    return total;
}

// --- DEEP SPACE NEBULA ---
vec3 computeNebula(vec3 rayDir) {
    vec3 p = rayDir * NEBULA_SCALE + vec3(0.0, u_time * 0.005, 0.0); // 0.005 = drift speed over time
    
    // Domain warping: distorts space using FBM offsets for organic gas tendrils
    vec3 q = vec3(fbm(p), fbm(p + vec3(5.2, 1.3, 2.8)), fbm(p + vec3(1.7, 9.2, 3.4))); // 5.2, 1.3, etc. = offset vectors
    float cloud = fbm(p + 1.8 * q); // 1.8 = warp distortion strength
    
    cloud = smoothstep(NEBULA_CUTOFF_LOW, NEBULA_CUTOFF_HIGH, cloud);
    
    vec3 colorCore = vec3(0.25, 0.05, 0.45); // Core gas color (Deep Purple)
    vec3 colorTeal = vec3(0.02, 0.30, 0.40); // Outer gas color (Turquoise Teal)
    vec3 colorDust = vec3(0.70, 0.20, 0.10); // Filament highlights (Crimson Red)

    vec3 neb = mix(colorCore, colorTeal, cloud);
    neb = mix(neb, colorDust, pow(cloud, 2.5)); // 2.5 = contrast curve exponent for dust
    return neb * cloud * NEBULA_BRIGHTNESS;
}

// --- DISTANT SPIRAL GALAXY ---
vec3 computeGalaxy(vec3 rayDir) {
    vec3 galaxyDir = normalize(vec3(0.65, 0.35, -0.68)); // World-space direction vector where galaxy sits
    float cosAngle = dot(rayDir, galaxyDir); // Angular distance alignment
    
    if (cosAngle < GALAXY_FOV_BOUND) return vec3(0.0); // Ignore rays outside bounding angular radius
    
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(galaxyDir, up));
    vec3 localUp = cross(right, galaxyDir);
    
    vec2 gUV = vec2(dot(rayDir, right), dot(rayDir, localUp)) * GALAXY_SCALE;
    float r = length(gUV); // Radius from galaxy center
    float angle = atan(gUV.y, gUV.x); // Polar angle

    // Spiral curve equation: 2.0 = arm count, 3.5 = arm logarithmic twist rate
    float spiral = sin(angle * 2.0 - log(r + 0.001) * 3.5);
    float core = exp(-r * 3.0) * 3.0; // 3.0 = central core falloff tightness
    float arms = exp(-r * 1.0) * smoothstep(-0.2, 0.8, spiral); // 1.0 = arm radial fade rate

    vec3 coreColor = vec3(1.0, 0.95, 0.8); // Warm core spectrum
    vec3 armColor  = vec3(0.4, 0.6, 1.0);  // Hot blue arm spectrum

    return (coreColor * core + armColor * arms * GALAXY_BRIGHTNESS) * smoothstep(1.0, 0.0, r * 0.6); // 0.6 = soft edge mask
}

// --- 3D STAR FIELD ---
float starField3D(vec3 rayDir, float scale, float threshold) {
    vec3 p = rayDir * scale;
    vec3 id = floor(p); // Unique cell ID
    vec3 gv = fract(p) - 0.5; // Cell local coordinates (-0.5 to 0.5)

    float n = hash31(id);
    if (n > threshold) {
        float dist = length(gv);
        float size = (n - threshold) / (1.0 - threshold); // Size scale (0.0 to 1.0)
        float twinkle = sin(u_time * 2.5 + n * 6.28) * 0.35 + 0.65; // 2.5 = twinkle speed, 0.35/0.65 = 30%-100% brightness range
        return smoothstep(size * 0.4, 0.0, dist) * twinkle; // 0.4 = star point radius multiplier
    }
    return 0.0;
}

void main() {
    // Safe camera direction fallback (prevents black screen if u_cameraDir is zero)
    vec3 forward = (length(u_cameraDir) < 0.001) ? vec3(0.0, 0.0, -1.0) : normalize(u_cameraDir);
    
    vec3 worldUp = (abs(forward.y) > 0.99) ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
    vec3 right   = normalize(cross(forward, worldUp));
    vec3 up      = cross(right, forward);

    // Compute ray direction across current screen FOV
    vec2 screenUV = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
    vec3 rayDir   = normalize(forward + screenUV.x * right + screenUV.y * up);

    // Ambient space void color
    vec3 color = vec3(0.002, 0.002, 0.006);

    // Add deep space layers
    color += computeNebula(rayDir);
    color += computeGalaxy(rayDir);

    // Render multi-layer star grid
    float majorStars = starField3D(rayDir, STAR_MAJOR_SCALE, STAR_MAJOR_DENSITY);
    float microStars = starField3D(rayDir + vec3(17.1), STAR_MICRO_SCALE, STAR_MICRO_DENSITY) * 0.6; // 17.1 = spatial offset, 0.6 = micro star dimming

    vec3 starRGB = vec3(majorStars + microStars);
    vec3 tintedStars = mix(starRGB * vec3(0.8, 0.9, 1.0), starRGB * vec3(1.0, 0.85, 0.7), hash31(floor(rayDir * STAR_MAJOR_SCALE)));

    color += tintedStars * STAR_BRIGHTNESS;

    outputColor = vec4(color, 1.0);
}