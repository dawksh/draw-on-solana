import * as anchor from "@project-serum/anchor";
import { Program, AnchorError } from "@project-serum/anchor";
import { assert } from "chai";
import { Draw } from "../target/types/draw";

describe("draw", () => {
  // Configure the client to use the local cluster.
  const anchorProvider = anchor.AnchorProvider.env();
  anchor.setProvider(anchorProvider);

  const program = anchor.workspace.Draw as Program<Draw>;

  it("can create a new pixel" , async () => {

    const keypair = anchor.web3.Keypair.generate()

    await program.methods.createPixel(0, 200, 0, 0, 255).accounts({
      pixel: keypair.publicKey,
      user: anchorProvider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    }).signers([keypair]).rpc().then(() => Promise.reject(new Error('Expected to error!')), (e: AnchorError) => {
      assert.ok(e.errorLogs.some(log => log.includes('InvalidYCoordinate') && log.includes('The given Y co-ordinate is not between 0-99.')))
    })

    const storedPixel = await program.account.pixel.fetch(keypair.publicKey)
    assert.equal(storedPixel.posX, 10)
    assert.equal(storedPixel.posY, 10)
    assert.equal(storedPixel.colR, 0)
    assert.equal(storedPixel.colG, 0)
    assert.equal(storedPixel.colB, 255)
  })
});
