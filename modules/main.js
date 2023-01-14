import * as THREE from "./three.module.js"
import { OrbitControls } from "./OrbitControls.js"
import { GLTFExporter } from "./GLTFExporter.js"
import { GUI } from "./dat.gui.module.js"

/** "Class" representing and handling terrain */
class Terrain {
    /** Object constructor */
    constructor( two_exponent, max_height, roughness, terrain_color, water_color ) {
        // exponent of two
        this.two_exponent = two_exponent;
        // height map size ( power of two + 1, because diamond-square algorithm requires it )
        this.size = Math.pow( 2, Math.round( this.two_exponent ) ) + 1;
        // array of heights, used as 2D matrix of SIZExSIZE
        this.height_map = new Float32Array( this.size*this.size );
        // maximal height for generating corners of heightmap
        this.max_height = max_height;
        // terrain roughness
        this.roughness = roughness;

        // default colors for terrain and water
        this.default_colors = {
            terrain: terrain_color,
            water: water_color
        };

        // textures for terrain and water
        const tex_loader = new THREE.TextureLoader();
        this.textures = {
            none: null,
            dirt: tex_loader.load( 'textures/dirt.jpg',
                function ( texture ) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.offset.set( 0, 0 );
                texture.repeat.set( 25, 25 );
            }),
            rock: tex_loader.load( 'textures/rock.jpg',
                function ( texture ) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.offset.set( 0, 0 );
                texture.repeat.set( 25, 25 );
            }),
            grass: tex_loader.load( 'textures/grass.jpg',
                function ( texture ) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.offset.set( 0, 0 );
                texture.repeat.set( 25, 25 );
            }),
            snow: tex_loader.load( 'textures/snow.jpg',
                function ( texture ) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.offset.set( 0, 0 );
                texture.repeat.set( 25, 25 );
            }),
            water: tex_loader.load( 'textures/water.png',
                function ( texture ) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.offset.set( 0, 0 );
                texture.repeat.set( 10, 10 );
            }),
        }

        // terrain material
        this.material = new THREE.MeshPhongMaterial({
            color: this.default_colors.terrain,
            specular:0x222222,
            shininess: 5,
            map: this.textures.none,
            wireframe: true,
            side: THREE.DoubleSide,
        });

        // water plane mesh, its initialization and add to scene
        this.water_mesh = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ),
                                          new THREE.MeshPhongMaterial({
                                                color: this.default_colors.water,
                                                opacity: 0.75,
                                                transparent: true,
                                                side: THREE.DoubleSide }));
        this.water_mesh.rotateX( -Math.PI/2 );
        this.water_mesh.position.x = -25;
        this.water_mesh.position.z = -5;
        scene.add( this.water_mesh );

        // initial terrain generation
        this.generate();
    }

    /** Creates new height map with updated size */
    #update_height_map() {
        this.size = Math.pow( 2, Math.round( this.two_exponent ) ) + 1;
        this.height_map = new Float32Array( this.size*this.size );
    }

    /** Using diamond-square algorithm generates heights and stores them to height map */
    #diamond_square() {
        var roughness = this.roughness;

        // generate corners of the height map
        this.height_map[0] = random_float( 0, this.max_height );
        this.height_map[this.size-1] = random_float( 0, this.max_height );
        this.height_map[this.size*this.size-this.size] = random_float( 0, this.max_height );
        this.height_map[this.size*this.size-1] = random_float( 0, this.max_height );

        // generating the heights
        var chunk_size = ( this.size - 1 );
        while ( chunk_size > 1 ){
            this.#square( chunk_size, roughness );      // square step
            this.#diamond( chunk_size, roughness );     // diamond step
            chunk_size /= 2;
            roughness /= 2;     // reduction of rougness for smoother terrain
        }
    }

    /**
     * Square step for diamond-square algorithm
     * @param { number } chunk_size: chunk size for current algorithm iteration
     * @param { number } roughness: terrain roughness for current algorithm iteration
     */
    #square( chunk_size, roughness ) {
        var half = chunk_size/2;

        // using heigh_map as 2D matrix ( [i*size + j] ==> col = j, row = i )
        // height is caculated as average of square corners + random from ( -roughness, rougness )
        for ( var i = 0; i < this.size - 1; i += chunk_size ) {
            for ( var j = 0; j < this.size - 1; j += chunk_size ) {
                this.height_map[( i + half )*this.size + ( j + half )] = (
                        this.height_map[i*this.size + j] +
                        this.height_map[i*this.size + ( j + chunk_size )] +
                        this.height_map[( i + chunk_size )*this.size + j] +
                        this.height_map[( i + chunk_size )*this.size + ( j + chunk_size )]
                    )/4 + random_float( -roughness, roughness );
            }
        }
    }

    /**
     * Calculates average of diamond corners
     * @param { number } i: row
     * @param { number } j: column
     * @param { number } half: chunk_size/2
     * @returns average of diamond corner values
     */
    #get_diamond_avg( i, j, half ) {
        var corners = new Array();

        // checks whether the corner is in height_map, average of element on
        // the edge of height_map is counted only from 3 diamond corners
        if ( i - half >= 0 )
            corners.push( this.height_map[( i - half )*this.size + j] );

        if ( i + half < this.size )
            corners.push( this.height_map[( i + half )*this.size + j] );

        if ( j - half >= 0 )
            corners.push( this.height_map[i*this.size + ( j - half )] );

        if ( j + half < this.size )
            corners.push( this.height_map[i*this.size + ( j + half )] );

        var sum = 0;
        for ( var i = 0; i < corners.length; i++ )
            sum += corners[i];

        return sum/corners.length
    }

    /**
     * Diamond step for diamond-square algorithm
     * @param { number } chunk_size: chunk size for current algorithm iteration
     * @param { number } roughness: terrain roughness for current algorithm iteration
     */
    #diamond( chunk_size, roughness ){
        var half = chunk_size/2;

        // using heigh_map as 2D matrix ( [i*size + j] ==> col = j, row = i )
        // height is caculated as average of diamond corners + random from ( -roughness, rougness )
        for ( var i = 0; i < this.size; i += half ) {
            for ( var j = ( i + half )%chunk_size; j < this.size; j += chunk_size ) {
                this.height_map[i*this.size + j] = (
                        this.#get_diamond_avg( i, j, half ) +
                        random_float( -roughness, roughness )
                    );
            }
        }
    }

    /**
     * Takes the height_map, applies its heights to plane representing
     * terrain and adds the plane/terrain_mesh to scene
     */
    #apply_height_map() {
        scene.remove( this.terrain_mesh );

        // create plane geometry
        var terrain_geometry = new THREE.PlaneGeometry( 100,
                                                        100,
                                                        this.size - 1,
                                                        this.size - 1 );

        // get plane vertices
        const vertices = terrain_geometry.getAttribute( 'position' );
        const vertex = new THREE.Vector3();

        // alter plane vertices using height_map
        for ( var i = 0; i < vertices.count; i++ ) {
            vertex.fromBufferAttribute( vertices, i );
            vertices.setXYZ( i, vertex.x, vertex.y, this.height_map[i] );
        }

        // compute the vertices normals for correct light refraction
        terrain_geometry.computeVertexNormals();

        // create terrain mesh
        this.terrain_mesh = new THREE.Mesh( terrain_geometry, this.material );

        // rotate terrain mesh to fit in the scene and add it to scene
        this.terrain_mesh.rotateX( -Math.PI/2 );
        scene.add( this.terrain_mesh );
    }

    /**
     * Applies given texture to the terrain mesh material
     * @param { bool } terrain: states whether to change terrain or water texture
     * @param { string } name: name of the texture
     */
    texture( terrain, name ) {
        if ( terrain ) {
            this.terrain_mesh.material.map = this.textures[name];
            this.terrain_mesh.material.needsUpdate = true;
        } else {
            this.water_mesh.material.map = this.textures[name];
            this.water_mesh.material.needsUpdate = true;
        }
    }

    /** Sets the color of terrain mesh to default/initialization value */
    default_terrain_color() {
        this.terrain_mesh.material.color.set( this.default_colors.terrain );
    }

    /** Sets the color of water mesh to default/initialization value */
    default_water_color() {
        this.water_mesh.material.color.set( this.default_colors.water );
    }

    /** Generates terrain and puts it in the scene */
    generate() {
        this.#update_height_map();
        this.#diamond_square();
        this.#apply_height_map();
        this.terrain_mesh.position.x = -25;
        this.terrain_mesh.position.z = -5;
        this.water_mesh.rotation.z = this.terrain_mesh.rotation.z;
    }
}

/**
 * Generates random float from interval ( min, max )
 * @param { number } min
 * @param { number } max
 * @returns
 */
function random_float( min, max ){
    return ( Math.random()*( max - min ) + min )
}

// dowload link element
const link = document.createElement( 'a' );
document.body.appendChild( link );

/** Three.js GLTFExporter saves scene into the .glb file */
function download_scene() {
    const exporter = new GLTFExporter();
    exporter.parse(
        scene,
        function( result ) {
            const blob = new Blob( [result] );
            link.href = URL.createObjectURL(  blob );
            link.download = 'scene.glb';
            link.click();
        },
        function ( error ) { console.log( error ); },
        { binary: true }
    );
}

// SCENE SETUP ==========================================================

// renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// creating scene itself and setting its background color
const scene = new THREE.Scene();
//scene.background = new THREE.Color( 0x101010 );

// adding camera to scene
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set( 50, 30, -40 );

// adding camera controls to move it with mouse
const controls = new OrbitControls( camera, renderer.domElement );

// adding lights to scene ( one ambient and one directional )
const ambient_light = new THREE.AmbientLight( 0xffffff, 0.5 );
scene.add( ambient_light );

const directional_light = new THREE.DirectionalLight( 0xffffdd, 0.4 );
directional_light.position.set( 0, 75, 0 );
scene.add( directional_light );
// END OF SCENE SETUP ===================================================

// initial colors
const init_colors = {
    terrain: 0xf765b8,
    water: 0x27fdf5,
}

// initializating gui
const gui = new GUI();
gui.close();

// creating terrain object and settings object used by gui
const terrain = new Terrain( 8, 0, 30, init_colors.terrain, init_colors.water );
const settings = {
    terrain_texture: 'none',    // terrain texture setting, initiali set to none ( plain )
    water_texture: 'none',      // water texture setting, initiali set to none ( plain )
    terrain_color: init_colors.terrain,     // terrain color setting, set to initial color value
    water_color: init_colors.water,         // water color setting, set to initial color value
    animation: true,    // animation/rotation switch
    speed: 0.001,       // animation/rotation speed
    download: function() { download_scene() }   // downloads the terrain in .glb format
}

// GUI SETUP ============================================================
// terrain folder containing options regarding terrain
const terrain_folder = gui.addFolder( 'Terrain Properties' );

// terrain detail ( the exponent of two ) ( slider )
terrain_folder.add( terrain, 'two_exponent', 0, 10, 1 )
              .name( 'Detail' )
              .onChange( function() { terrain.generate(); } );

// max height of terrains initial corners ( slider )
terrain_folder.add( terrain, 'max_height', 0, 50, 0.1 )
              .name( 'Height' )
              .onChange( function() { terrain.generate(); } );

// terrain roughness ( slider )
terrain_folder.add( terrain, 'roughness', 5, 100, 0.1 )
              .name( 'Roughness' )
              .onChange( function() { terrain.generate(); } );

// material folder containing terrain surface options
const material_folder = gui.addFolder( 'Terrain Surface' );

// toggles terrain wireframe ( checkbox )
material_folder.add( terrain.terrain_mesh.material, 'wireframe' ).name( 'Wireframe' );

// changes terrain texture ( dropdown )
material_folder.add( settings, 'terrain_texture',
                     { Plain: 'none', Dirt: 'dirt', Rock: 'rock', Grass: 'grass', Snow: 'snow' } )
               .name( 'Texture' )
               .onChange( function() {
                    settings.terrain_color = 0xffffff;
                    gui.updateDisplay();
                    terrain.terrain_mesh.material.color.set( 0xffffff );
                    terrain.texture( true, settings.terrain_texture );
                } );

// changes terrain color ( colorpicker )
material_folder.addColor( settings, 'terrain_color' )
               .name('Color')
               .onChange( function() {
                    terrain.terrain_mesh.material.color.set( settings.terrain_color );
                } );

// resets terrain color to default value ( button )
material_folder.add( terrain, 'default_terrain_color' )
               .name( 'Default Color' )
               .onChange( function() {
                   settings.terrain_color = terrain.default_colors.terrain;
                   gui.updateDisplay();
                } );

// water folder containing options for water
const water_folder = gui.addFolder( 'Water Surface' );

// height of water surface ( slider )
water_folder.add( terrain.water_mesh.position, 'y', -100, 100, 0.1 ).name( 'Height' );

// opacity of water surface ( slider )
water_folder.add( terrain.water_mesh.material, 'opacity', 0, 1, 0.05 ).name( 'Transparency' );

// changes water surface texture ( dropdown )
water_folder.add( settings, 'water_texture',
                  { Plain: 'none', Water: 'water' } )
            .name( 'Texture' )
            .onChange( function() {
                 settings.water_color = 0xffffff;
                 gui.updateDisplay();
                 terrain.water_mesh.material.color.set( 0xffffff );
                 terrain.texture( false, settings.water_texture );
            } );

// changes water surface color ( colorpicker )
water_folder.addColor( settings, 'water_color' )
            .name('Color')
            .onChange( function() { terrain.water_mesh.material.color.set( settings.water_color ); } );

// resets water surface color to default value ( button )
water_folder.add( terrain, 'default_water_color' )
            .name( 'Default Color' )
            .onChange( function() {
                settings.water_color = terrain.default_colors.water;
                gui.updateDisplay();
             } );

// animation folder containing animation options
const animation_folder = gui.addFolder( 'Animation' );

// toggles animation/rotation ( checkbox )
animation_folder.add( settings, 'animation' ).name( 'Animate' );

// speed of animation/rotation  ( slider )
animation_folder.add( settings, 'speed', 0, 0.01, 0.0001 ).name( 'Animation Speed' );

// exports the scene as .glb file
gui.add( settings, 'download' ).name( 'Download Terrain' );
// END OF GUI SETUP =====================================================

/** Handles correct scene rendering after window reisize */
window.addEventListener( 'resize', on_window_resize, false );
function on_window_resize(){
    // updates properities of camera and renderer according to window dimensions
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

/** Handles the scene rendering and animating objects */
function animate() {
    if ( settings.animation == true ) {
        terrain.terrain_mesh.rotation.z += settings.speed;
        terrain.water_mesh.rotation.z += settings.speed;
    }

    renderer.render( scene, camera );
    requestAnimationFrame( animate );
}

animate();
