
// Low Level - API Hooking
import { capi, RawTypeId } from "bdsx";
import { BlockPos } from "bdsx/bds/blockpos";
import { SurvivalMode } from "bdsx/bds/gamemode";
import { TextPacket } from "bdsx/bds/packets";
import { SYMOPT_UNDNAME } from "bdsx/common";
import { pdb } from "bdsx/core";
import { ProcHacker } from "bdsx/prochacker";

if (!capi.isRunningOnWine()) { // Skip for Linux, pdb is not working on Wine.
    // the API hooking is possible on Wine with the generated cache.

    pdb.setOptions(SYMOPT_UNDNAME); // use undecorated symbol names. without this, ProcHacker.load will use mangled names
    const hacker = ProcHacker.load('../pdbcache_by_example.ini', ['SurvivalMode::destroyBlock']);
    pdb.setOptions(0); // reset the option
    pdb.close(); // close the pdb to reduce the resource usage.

    let halfMiss = false;
    function onDestroyBlock(gameMode:SurvivalMode, blockPos:BlockPos, v:number):boolean {
        halfMiss = !halfMiss;
        const ni = gameMode.actor.getNetworkIdentifier();
        const packet = TextPacket.create();
        packet.message = `${halfMiss ? 'missed' : 'destroyed'}: ${blockPos.x} ${blockPos.y} ${blockPos.z} ${v}`;
        packet.sendTo(ni);
        packet.dispose();

        if (halfMiss) return false;
        return originalFunc(gameMode, blockPos, v);
    }

    // bool SurvivalMode::destroyBlock(BlockPos&,unsigned char); // it can be dug with the disassembler.
    const originalFunc = hacker.hooking('SurvivalMode::destroyBlock', RawTypeId.Boolean, null, SurvivalMode, BlockPos, RawTypeId.Int32)(onDestroyBlock);
}

