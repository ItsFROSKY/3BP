cmake_minimum_required(VERSION 3.12)
project(3BP CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)


add_subdirectory(raylib)

configure_file(${CMAKE_CURRENT_SOURCE_DIR}/shader.vert ${CMAKE_CURRENT_BINARY_DIR}/shader.vert COPYONLY)
configure_file(${CMAKE_CURRENT_SOURCE_DIR}/shader.frag ${CMAKE_CURRENT_BINARY_DIR}/shader.frag COPYONLY)

add_executable(3BP 3bp.cpp classes_and_functions.cpp physics.cpp)

target_link_libraries(3BP PRIVATE raylib)

target_include_directories(3BP PRIVATE raylib/src)