#include <iostream>
#include <cmath>
#include "raylib.h"

using namespace std;


void dom(int& k) {
    k *= 2;
}

int main () {

    double convert = 0.0175;
    double angle = 30*convert;
    double resultx = cos(angle);
    double resulty = sin(angle);
    
    double resultz = 0;
    cout << "x: "<< (float)resultx <<endl << "y: "<< (float)resulty <<endl << "z: "<<resultz;

    Vector3 test = {1, 2, 3};
  cout << "test: " << test.x << ", " << test.y << ", " << test.z << "\n";

    return 0;



}