varying vec3 vNormal;

void main () {
  float intensity = pow( 1.2 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 8.0 );
  gl_FragColor = vec4( 0.3, 0.5, 1.0, 0.3 ) * intensity;
}