#include "StarLib.h"
#include "raylib.h"
#include "settings.h"
#include <cmath>
#include <iostream>

void gravity(star &stars, Sound &sound) {
  int size = stars.pos.size();

  if (size <= 1) {
    return;
  } // if it's a single star, no nedd for gravity

  for (int i = 0; i < size; i++)
    stars.dv[i] = Vector3{0.0f, 0.0f, 0.0f};

  // reset the acceleration for each star for the new frame, so we can
  // recalculate it based on the new positions of the stars
  // then we sum the terms and then
  // apply the acceleration to the velocity, then apply the velocity to the
  // position.

  for (int i = 0; i < size; i++) {
    for (int j = i + 1; j < size; j++) {
      float dx = stars.pos[i].x - stars.pos[j].x;
      float dy = stars.pos[i].y - stars.pos[j].y;
      float dz = stars.pos[i].z - stars.pos[j].z;
      float d2 = dx * dx + dy * dy + dz * dz + stars.epsilon_squared;
      float d = sqrt(d2); // d = distance
      float d3 = d2 * d;
      float factori =
          G * stars.mass[j] / (d3); // the acceleration of star i due to star j
      float factorJ =
          G * stars.mass[i] / (d3); // the acceleration of star j due to star i

      // update the acceleration of both stars
      stars.dv[i].x -= factori * dx;
      stars.dv[i].y -= factori * dy;
      stars.dv[i].z -= factori * dz;

      stars.dv[j].x += factorJ * dx;
      stars.dv[j].y += factorJ * dy;
      stars.dv[j].z += factorJ * dz;

      if (d < 150.0 && !IsSoundPlaying(sound)) {
        PlaySound(sound);
      } // play sound if distance is less
    }
  }
}

// the loop to update volcity
void applyGravity(star &stars, float dt) {
  int size = stars.pos.size();

  for (int i = 0; i < size; i++) {
    // the loop to update vel in x,y,x
    stars.vel[i].x += stars.dv[i].x * dt;
    stars.vel[i].y += stars.dv[i].y * dt;
    stars.vel[i].z += stars.dv[i].z * dt;

    // the loop to update pos in x,y,x
    stars.pos[i].x += stars.vel[i].x * dt;
    stars.pos[i].y += stars.vel[i].y * dt;
    stars.pos[i].z += stars.vel[i].z * dt;
  }
}

Vector3 angleConvert(float angle, float magnitude) {
  Vector3 result;

  angle *= convert;

  result.x = magnitude * (float)cos(angle);
  result.y = magnitude * (float)sin(angle);
  result.z = 0;
  return result;
}

void stableTwoStars(star &stars, float swivel, float tilt, int j, int k) {
  // star num j, and star num k

  tilt *= convert;
  swivel *= convert;

  float dx = stars.pos[j].x - stars.pos[k].x;
  float dy = stars.pos[j].y - stars.pos[k].y;
  float dz = stars.pos[j].z - stars.pos[k].z;
  float d = sqrt(dx * dx + dy * dy + dz * dz);

  float sum = stars.mass[j] + stars.mass[k];
  float factor = sqrt(G / (d * sum)) / d;

  Vector3 normal;
  normal.x = sin(tilt) * cos(swivel);
  normal.y = sin(tilt) * sin(swivel);
  normal.z = cos(tilt);

  Vector3 raw;
  raw.x = (dy * normal.z) - (dz * normal.y);
  raw.y = (dz * normal.x) - (dx * normal.z);
  raw.z = (dx * normal.y) - (dy * normal.x);

  // Change stars.vel[j].x to:
  stars.vel[j].x = factor * stars.mass[k] * raw.x;
  stars.vel[j].y = factor * stars.mass[k] * raw.y;
  stars.vel[j].z = factor * stars.mass[k] * raw.z;

  // And for the star num k (equal and opposite momentum if masses differ):
  stars.vel[k].x = factor * stars.mass[j] * raw.x;
  stars.vel[k].y = factor * stars.mass[j] * raw.y;
  stars.vel[k].z = factor * stars.mass[j] * raw.z;
}