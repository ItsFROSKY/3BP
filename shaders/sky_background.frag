#version 330
in vec2 fragTexCoord;
out vec4 outputColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_cameraDir; // Passed from C++

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

// Convert 3D camera vector into 2D spherical UV offset (Yaw/Pitch)
vec2 getCameraOffset(vec3 dir) {
    float yaw = atan(dir.z, dir.x);
    float pitch = asin(clamp(dir.y, -1.0, 1.0));
    return vec2(yaw, pitch) * 0.4; // 0.4 controls panning speed
}

float starField(vec2 uv, float densityThreshold, float starScale) {
    vec2 id = floor(uv * starScale);
    vec2 gv = fract(uv * starScale) - 0.5;
    
    float n = hash21(id);
    float star = 0.0;
    
    // Higher threshold = FAR fewer stars (0.97 means only top 3% cells spawn a star)
    if (n > densityThreshold) {
        float size = (n - densityThreshold) * 2.5; // Smaller, sharper points
        float dist = length(gv);
        float twinkle = sin(u_time * 2.0 + n * 6.28) * 0.3 + 0.7;
        
        star = smoothstep(size, 0.0, dist) * twinkle;
    }
    return star;
}

void main() {
    // 1. Base Screen UVs
    vec2 screenUV = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
    
    // 2. Add Camera Parallax Offset (moves sky with camera rotation)
    vec2 camOffset = getCameraOffset(normalize(u_cameraDir));
    vec2 skyUV = screenUV + camOffset;

    // 3. Deep Space Gradient
    vec3 bg = mix(vec3(0.002, 0.002, 0.008), vec3(0.0002, 0.0002, 0.0008), length(screenUV));

    // 4. Sparser Star Layers (High thresholds for few, faint stars)
    float mainStars  = starField(skyUV, 0.975, 40.0); // Primary faint stars
    float tinyStars  = starField(skyUV + vec2(12.3, 45.6), 0.985, 90.0) * 0.5; // Distant micro stars

    vec3 starColor = vec3(mainStars + tinyStars);
    
    // Subtle color temperature tinting (faint blue/warm tones)
    vec3 tintedStars = mix(starColor * vec3(0.8, 0.9, 1.0), starColor * vec3(1.0, 0.85, 0.7), hash21(floor(skyUV * 40.0)));

    outputColor = vec4(bg + tintedStars * 0.6, 1.0);
}