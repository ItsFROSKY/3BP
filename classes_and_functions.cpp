#include "StarLib.h"

void star::addStar(Vector3Double position, float newMass, float radius,
                   Vector3Double velocity, Color newColor) {
  pos.push_back(position);
  mass.push_back(newMass);
  rad.push_back(radius);
  vel.push_back(velocity);
  dv.push_back(Vector3Double{0.0, 0.0, 0.0});
  dp.push_back(Vector3Double{0.0, 0.0, 0.0});
  color.push_back(newColor);
}



float pairPressed(int key1, int key2) {
  return (float)IsKeyDown(key1) - (float)IsKeyDown(key2);
}

void move(Vector3Double &original, Vector3Double direction, float speed, float dt) {
  original.x += direction.x * speed * dt;
  original.y += direction.y * speed * dt;
  original.z += direction.z * speed * dt;
}

Vector3 convertVcetor3 (Vector3Double old) {
  Vector3 converted;
  converted.x = (float) old.x;
  converted.y = (float) old.y;
  converted.z = (float) old.z;
  return converted;
}

