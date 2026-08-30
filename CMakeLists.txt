cmake_minimum_required(VERSION 3.12)
project(3BP CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_subdirectory(raylib)

# ------------------------------------------------------------
# Shader synchronization
# ------------------------------------------------------------

set(SHADER_SOURCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/shaders")
set(SHADER_BUILD_DIR  "${CMAKE_CURRENT_BINARY_DIR}/shaders")

add_custom_target(sync_shaders ALL
    COMMAND ${CMAKE_COMMAND} -E rm -rf "${SHADER_BUILD_DIR}"
    COMMAND ${CMAKE_COMMAND} -E copy_directory
            "${SHADER_SOURCE_DIR}"
            "${SHADER_BUILD_DIR}"
    COMMENT "Syncing shaders: source -> build"
)

# ------------------------------------------------------------
# Executable
# ------------------------------------------------------------

add_executable(3BP
    3bp.cpp
    classes_and_functions.cpp
    physics.cpp
)

add_dependencies(3BP sync_shaders)

target_link_libraries(3BP PRIVATE raylib)

target_include_directories(3BP PRIVATE raylib/src)