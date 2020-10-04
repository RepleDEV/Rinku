import * as _ from "lodash";

interface CoordinateObject {
    x: number;
    y: number;
}

interface ScreenCoordinateObject {
    width: number;
    height: number;
    id: string;
    pos: CoordinateObject;
}

let screenCoords: Array<ScreenCoordinateObject> = [];

class ScreenMap {
    /**
     * Screen Map coordinate plane system.
     * @param screenWidth Master screen's width.
     * @param screenHeight Master screen's height.
     */
    constructor(screenWidth: number, screenHeight: number) {
        screenCoords.push({
            width: screenWidth,
            height: screenHeight,
            id: "master",
            pos: {
                x: 0,
                y: 0,
            },
        });
    }
    addScreen(
        screenWidth: number,
        screenHeight: number,
        xPos: number,
        yPos: number,
        id: string
    ): boolean {
        if(!ScreenMap.checkScreen(screenWidth, screenHeight, {x: xPos, y: yPos})) {
            return false;
        }
        screenCoords.push({
            width: screenWidth,
            height: screenHeight,
            id: id,
            pos: {
                x: xPos,
                y: yPos,
            },
        });

        return true;
    }
    static checkScreen(
        screenWidth: number,
        screenHeight: number,
        coord: CoordinateObject
    ): boolean {
        const pillars: Array<[number, number]> = [];
        const rows: Array<[number, number]> = [];

        for (let i = 0; i < screenCoords.length; i++) {
            let { width, height, pos } = screenCoords[0];
            let { x, y } = pos;
            pillars.push([x, x + width]);
            rows.push([y, y + height]);

            let hasOverlap = this.isOverlap(
                coord,
                { x: coord.x + screenWidth, y: coord.y + screenHeight },
                pos,
                { x: x + width, y: y + height }
            );
            if (hasOverlap) {
                return false;
            }
        }

        for (let i = 0; i < screenCoords.length; i++) {
            let pillar = pillars[i];
            let row = rows[i];
            if (coord.x + screenWidth == pillar[0] || coord.x == pillar[1]) {
                if (
                    (coord.y >= row[0] && coord.y < row[1]) ||
                    (coord.y + screenHeight <= row[1] &&
                        coord.y + screenHeight > row[0])
                ) {
                    return true;
                } else {
                    return false;
                }
            } else if (
                (coord.x >= pillar[0] && coord.x < pillar[1]) ||
                (coord.x + screenWidth <= pillar[1] &&
                    coord.x + screenWidth > pillar[0])
            ) {
                if (coord.y == row[1] || coord.y + screenHeight == row[0]) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    }
    /**
     * Checks if two rectangles are overlapping
     * @param l1 NW Corner of first rectangle
     * @param r1 SE Corner of first rectangle
     * @param l2 NW Corner of 2nd rectangle.
     * @param r2 SE Corner of 2nd rectangle
     */
    static isOverlap(
        l1: CoordinateObject,
        r1: CoordinateObject,
        l2: CoordinateObject,
        r2: CoordinateObject
    ): boolean {
        if (_.isEqual(l1, l2) && _.isEqual(r1, r2)) return true;

        if (l1.x < l2.x) {
            if (r1.x <= l2.x) {
                return false;
            } else {
                if (r1.y >= l2.y || l1.y <= r2.y) {
                    return false;
                } else {
                    return true;
                }
            }
        } else {
            if (l1.x >= r2.x) {
                return false;
            } else {
                if (r1.y >= l2.y || l1.y <= r2.y) {
                    return false;
                } else {
                    return true;
                }
            }
        }
    }
}

const screemap = new ScreenMap(1366, 768);
console.log(ScreenMap.checkScreen(1366, 736, { x: -1366, y: 0 }));
