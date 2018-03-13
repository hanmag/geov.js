varying vec3 vNormal;

void main () {
  float intensity = pow( 1.32 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 8.0 );
  if (intensity > 12.0) intensity = intensity * 0.06;
  else if (intensity > 3.0) intensity = 9.0 / intensity;
  gl_FragColor = vec4( 0.3, 0.5, 1.0, 0.3 ) * intensity;
}