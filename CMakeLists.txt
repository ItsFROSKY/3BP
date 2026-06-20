cmake_minimum_required(VERSION 3.12)
project(3BP CXX)

add_subdirectory(raylib)

add_executable(3BP 3bp.cpp test.cpp test.h)

target_link_libraries(3BP PRIVATE raylib)

target_include_directories(3BP PRIVATE raylib/src)