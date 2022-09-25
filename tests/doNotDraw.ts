import * as anchor from "@project-serum/anchor";
import { AnchorError, Program } from "@project-serum/anchor";
import { web3 } from "@project-serum/anchor";
import { Draw } from "../target/types/draw";
import { assert } from "chai"

// New test to add inside the describe block
it("Does not allow creating a pixel out of bounds", async () => {
    const pixelKeypair = web3.Keypair.generate()

    const program = anchor.workspace.Draw as Program<Draw>;
    const anchorProvider = anchor.AnchorProvider.env();


    await program.methods
        .createPixel(0, 200, 0, 0, 255)
        .accounts({
            pixel: pixelKeypair.publicKey,
            user: anchorProvider.wallet.publicKey,
            systemProgram: web3.SystemProgram.programId,
        })
        .signers([pixelKeypair])
        .rpc()
        .then(
            () => Promise.reject(new Error('Expected to error!')),
            (e: AnchorError) => {
                assert.ok(e.errorLogs.some(log => log.includes('InvalidYCoordinate') && log.includes('The given Y co-ordinate is not between 0-99.')))
            }
        );
})

