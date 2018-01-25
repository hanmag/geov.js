const PI = 3.141592653589793;
const PI2 = PI * 2;
const HALFPI = PI / 2;
const MAXPHI = 1.2626272556789115; // Math.atan(PI)

export default {
    PI: PI,
    PI2: PI2,
    HALFPI: HALFPI,
    MAXPHI: MAXPHI,
    numerationSystemTo10: function (numSys, strNum) {
        var sum = 0;
        for (var i = 0; i < strNum.length; i++) {
            var level = strNum.length - 1 - i;
            var key = parseInt(strNum[i]);
            sum += key * Math.pow(numSys, level);
        }
        return sum;
    }
}