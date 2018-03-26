attribute float size;
varying vec3 vColor;

void main() {
	vColor = color;
	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
	gl_PointSize = size * (1.0 + 50000000.0 / length( mvPosition.xyz ) );
    if(length( mvPosition.xyz ) < 20000000.0) gl_PointSize = 0.0;
	gl_Position = projectionMatrix * mvPosition;
}