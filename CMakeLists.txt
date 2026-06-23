cmake_minimum_required(VERSION 3.12)
project(3BP CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)


add_subdirectory(raylib)

add_executable(3BP 3bp.cpp classes.cpp StarLib.h)

target_link_libraries(3BP PRIVATE raylib)

target_include_directories(3BP PRIVATE raylib/src)