#include "starLib.h"
#include <cmath>
#include <iostream>


void gravity(star &starsObj) {
  int size = starsObj.pos.size();
  float G = 1.0f; // normalize the G value
  float epsilon_squared = 0.5f;

  for (int i = 0; i < size; i++) {
    starsObj.vel[i] = 0.0f;
  } // so each acceleration is now a container, then we sum the terms and then
    // apply the acceleration to the velocity, then apply the velocity to the
    // position.

  for (int i = 0; i < size; i++) {
    for (int j = i + 1; j < size; j++) {
        float dx = starsObj.pos[i].x - starsObj.pos[j].x;
        float dy = starsObj.pos[i].y - starsObj.pos[j].y;
        float dz = starsObj.pos[i].z - starsObj.pos[j].z;
        float d2 = dx * dx + dy * dy + dz * dz + epsilon_squared;
        float d3 = d2 * sqrt(d2);
        float factor = G * starsObj.mass[j] / (d3);

        //update the velocities of both stars  
        starsObj.vel[i].x -= factor * dx;
        starsObj.vel[i].y -= factor * dy;
        starsObj.vel[i].z -= factor * dz;
        starsObj.vel[j].x += factor * dx;
        starsObj.vel[j].y += factor * dy;
        starsObj.vel[j].z += factor * dz;
    }
  }
}