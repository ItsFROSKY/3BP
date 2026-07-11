#include "StarLib.h"
#include "raylib.h"
#include "settings.h"
#include <cmath>
#include <iostream>

void updateAcceleration(star &stars, vector<Vector3Double> &tempPos, vector<Vector3Double> &dvTemp) {
  int size = stars.pos.size();


  for (int i = 0; i < size; i++) {
    for (int j = i + 1; j < size; j++) {
      double dx = stars.pos[i].x - stars.pos[j].x;
      double dy = stars.pos[i].y - stars.pos[j].y;
      double dz = stars.pos[i].z - stars.pos[j].z;


      double d2 = (dx * dx) + (dy * dy) + (dz * dz) + stars.epsilon_squared;
      double d = sqrt(d2); // d = distance
      double d3 = d2 * d;
      double factori = G * stars.mass[j] / (d3); // the acceleration of star i due to star j
      double factorJ = G * stars.mass[i] / (d3); // the acceleration of star j due to star i

      // update the acceleration of both stars
      dvTemp[i].x -= factori * dx;
      dvTemp[i].y -= factori * dy;
      dvTemp[i].z -= factori * dz;

      dvTemp[j].x += factorJ * dx;
      dvTemp[j].y += factorJ * dy;
      dvTemp[j].z += factorJ * dz;
    }
  }
}


void RK4Method (star &stars, vector<Vector3Double>& dpTemp, vector<Vector3Double>& dvTemp, vector<Vector3Double>& dp_Goal, vector<Vector3Double>& dv_Goal , float dt) {
  int size = dpTemp.size();
  vector<Vector3Double> tempPos(size), tempVel(size);

   
for (int i = 0; i < size; i++){
    tempPos[i].x = stars.pos[i].x + dpTemp[i].x*dt;
    tempPos[i].y = stars.pos[i].y + dpTemp[i].y*dt;
    tempPos[i].z = stars.pos[i].z + dpTemp[i].z*dt;

    tempVel[i].x = stars.vel[i].x + dvTemp[i].x*dt;
    tempVel[i].y = stars.vel[i].y + dvTemp[i].y*dt;
    tempVel[i].z = stars.vel[i].z + dvTemp[i].z*dt;

    dp_Goal[i] = tempVel[i];
  }
  updateAcceleration(stars, tempPos, dv_Goal);

}


void RK4 (star &stars, float dt) {
  int size = stars.pos.size();
  vector<Vector3Double> dp1(size), dp2(size), dp3(size), dp4(size), dv1(size), dv2(size), dv3(size), dv4(size), tempPos(size), tempVel(size);

  for (int i =0; i < size; i++) {
    dp1[i] = stars.vel[i];
  }

  updateAcceleration(stars, tempPos, dv1);

  RK4Method(stars, dp1, dv1, dp2, dv2, dt*0.5f);
  RK4Method(stars, dp2, dv2, dp3, dv3, dt*0.5f);
  RK4Method(stars, dp3, dv3, dp4, dv4, dt);
  
  for (int i = 0; i < size; i++) {
    stars.pos[i].x += (dt/6.0f)*(dp1[i].x + 2.0f*(dp2[i].x + dp3[i].x) + dp4[i].x);
    stars.pos[i].y += (dt/6.0f)*(dp1[i].y + 2.0f*(dp2[i].y + dp3[i].y) + dp4[i].y);
    stars.pos[i].z += (dt/6.0f)*(dp1[i].z + 2.0f*(dp2[i].z + dp3[i].z) + dp4[i].z);

    stars.vel[i].x += (dt/6.0f)*(dv1[i].x + 2.0f*(dv2[i].x + dv3[i].x) + dv4[i].x);
    stars.vel[i].y += (dt/6.0f)*(dv1[i].y + 2.0f*(dv2[i].y + dv3[i].y) + dv4[i].y);
    stars.vel[i].z += (dt/6.0f)*(dv1[i].z + 2.0f*(dv2[i].z + dv3[i].z) + dv4[i].z);
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

  Vector3Double normal;
  normal.x = sin(tilt) * cos(swivel);
  normal.y = sin(tilt) * sin(swivel);
  normal.z = cos(tilt);

  Vector3Double raw;
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