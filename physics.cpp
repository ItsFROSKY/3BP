#include "settings.h"
#include "starLib.h"
#include <cmath>
#include <iostream>


void gravity(star &stars) {
  int size = stars.pos.size();
  float epsilon_squared = 0.25f;

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
      float d2 = dx * dx + dy * dy + dz * dz + epsilon_squared;
      float d3 = d2 * sqrt(d2);
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

Vector3 angleConvert(double angle, float magnitude) {
  Vector3 result;

  angle *= convert;

  result.x = magnitude * (float)cos(angle);
  result.y = magnitude * (float)sin(angle);
  result.z = 0;
  return result;
}

void stableTwoStars(star &stars, float swivel, float tilt) {

  float dx = stars.pos[0].x - stars.pos[1].x;
  float dy = stars.pos[0].y - stars.pos[1].y;
  float dz = stars.pos[0].z - stars.pos[1].z;
  float d = sqrt(dx * dx + dy * dy + dz * dz);

  float sum = stars.mass[0] + stars.mass[1];
  float factor = sqrt(G / (d * sum))/d;

  Vector3 normal;
    normal.x = sin(tilt) * cos(swivel);
    normal.y = sin(tilt) * sin(swivel);
    normal.z = cos(tilt);

    Vector3 raw;
  raw.x = (dy * normal.z) - (dz * normal.y);
  raw.y = (dz * normal.x) - (dx * normal.z);
  raw.z = (dx * normal.y) - (dy * normal.x);

  // Change stars.vel[0].x to:
  stars.vel[0].x = factor * stars.mass[1] * dy  *raw.x;
  stars.vel[0].y = factor * stars.mass[1] * -dx*raw.y;
  stars.vel[0].z = factor * stars.mass[1] *raw.z;

  

  // And for the second star (equal and opposite momentum if masses differ):
  stars.vel[1].x = factor * stars.mass[0] * raw.x;
  stars.vel[1].y = factor * stars.mass[0] * raw.y;
  stars.vel[1].z = factor * stars.mass[0] * raw.z;
}   