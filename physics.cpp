#include "starLib.h"
#include <cmath>
#include <iostream>

void gravity(star &stars) {
  int size = stars.pos.size();
  float G = 10.0f; // normalize the G value
  float epsilon_squared = 0.25f;

  for (int i = 0; i < size; i++) {
  } // so each acceleration is now a container, then we sum the terms and then
    // apply the acceleration to the velocity, then apply the velocity to the
    // position.

  for (int i = 0; i < size; i++) {
    for (int j = i + 1; j < size; j++) {
      float dx = stars.pos[i].x - stars.pos[j].x;
      float dy = stars.pos[i].y - stars.pos[j].y;
      float dz = stars.pos[i].z - stars.pos[j].z;
      float d2 = dx * dx + dy * dy + dz * dz + epsilon_squared;
      float d3 = d2 * sqrt(d2);
      float factor = G * stars.mass[j] / (d3);

      // update the acceleration of both stars
      stars.dv[i].x -= factor * dx;
      stars.dv[i].y -= factor * dy;
      stars.dv[i].z -= factor * dz;

      stars.dv[j].x += factor * dx;
      stars.dv[j].y += factor * dy;
      stars.dv[j].z += factor * dz;
    }
  }
}

// the loop to update volcity
void applyGravity(star &stars, float dt) {
  int size = stars.pos.size();

  for (int i = 0; i < size; i++) {
    //the loop to update vel in x,y,x
    stars.vel[i].x += stars.dv[i].x * dt;
    stars.vel[i].y += stars.dv[i].y * dt;
    stars.vel[i].z += stars.dv[i].z * dt;

    //the loop to update pos in x,y,x
    stars.pos[i].x += stars.vel[i].x * dt;
    stars.pos[i].y += stars.vel[i].y * dt;
    stars.pos[i].z += stars.vel[i].z * dt;
  }
}

Vector3 angleConvert(double angle, float magnitude) {
    Vector3 result;

    double convert = 0.0175; //this is pi/180
    angle *= convert;



    result.x = magnitude * (float)cos(angle);
    result.y = magnitude * (float)sin(angle);
    result.z = 0;
    return result;
}