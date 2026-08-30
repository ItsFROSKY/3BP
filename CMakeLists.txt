cmake_minimum_required(VERSION 3.12)
project(3BP CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)


add_subdirectory(raylib)

# Copy shader files to the build directory
# Recursively collect all files relative to the shaders folder
file(GLOB_RECURSE ALL_SHADERS CONFIGURE_DEPENDS
    RELATIVE "${CMAKE_CURRENT_SOURCE_DIR}/shaders"
    "${CMAKE_CURRENT_SOURCE_DIR}/shaders/*"
)

foreach(SHADER_REL ${ALL_SHADERS})
    configure_file(
        "${CMAKE_CURRENT_SOURCE_DIR}/shaders/${SHADER_REL}"
        "${CMAKE_CURRENT_BINARY_DIR}/shaders/${SHADER_REL}"
        COPYONLY
    )
endforeach()

add_executable(3BP 3bp.cpp classes_and_functions.cpp physics.cpp)

target_link_libraries(3BP PRIVATE raylib)

target_include_directories(3BP PRIVATE raylib/src)