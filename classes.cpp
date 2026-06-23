#include "StarLib.h"

void star::addStar(Vector3 position, float newMass, float radius,
                   float velocity, Color newColor) {
  pos.push_back(position);
  mass.push_back(newMass);
  rad.push_back(radius);
  vel.push_back(velocity);
  dv.push_back(0.0f);
  dp.push_back(0.0f);
  color.push_back(newColor);
}