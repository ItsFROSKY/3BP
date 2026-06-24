#include <iostream>
#include <cmath>

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

    return 0;



}