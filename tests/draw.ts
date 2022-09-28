import * as anchor from "@project-serum/anchor";
import { Program, AnchorError, web3 } from "@project-serum/anchor";
import { assert } from "chai";
import { Draw } from "../target/types/draw";

describe("draw", () => {
  // Configure the client to use the local cluster.
  const anchorProvider = anchor.AnchorProvider.env();
  anchor.setProvider(anchorProvider);

  const program = anchor.workspace.Draw as Program<Draw>;

  it("can create a new pixel", async () => {

    const x = 10;
    const y = 10;

    const [pixelPubKey] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("pixel"), Buffer.from([x, y])], program.programId)

    await program.methods.createPixel(x, y, 0, 0, 255).accounts({
      pixel: pixelPubKey,
      user: anchorProvider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    }).rpc()

    const storedPixel = await program.account.pixel.fetch(pixelPubKey)
    assert.equal(storedPixel.posX, 10)
    assert.equal(storedPixel.posY, 10)
    assert.equal(storedPixel.colR, 0)
    assert.equal(storedPixel.colG, 0)
    assert.equal(storedPixel.colB, 255)
  })

  // New test to add inside the describe block
  it("Does not allow creating a pixel out of bounds", async () => {

    const x = 0;
    const y = 200;

    const program = anchor.workspace.Draw as Program<Draw>;
    const anchorProvider = anchor.AnchorProvider.env();
    const [pixelKey] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('pixel'), Buffer.from([x, y])], program.programId)


    await program.methods
      .createPixel(0, 200, 0, 0, 255)
      .accounts({
        pixel: pixelKey,
        user: anchorProvider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()
      .then(
        () => Promise.reject(new Error('Expected to error!')),
        (e: AnchorError) => {
          assert.ok(e.errorLogs.some(log => log.includes('InvalidYCoordinate') && log.includes('The given Y co-ordinate is not between 0-99.')))
        }
      );
  })



  it("Does not allow creating the same pixel twice", async () => {
    const x = 10
    const y = 10

    const [pixelPublicKey] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("pixel"), Buffer.from([x, y])],
      program.programId,
    )
    // Create a pixel with pixelPublicKey account first time 
    await program.methods
      .createPixel(x, y, 0, 0, 255)
      .accounts({
        pixel: pixelPublicKey,
        user: anchorProvider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()

    // Create a pixel with pixelPublicKey account second time 
    await program.methods
      .createPixel(x, y, 0, 0, 255)
      .accounts({
        pixel: pixelPublicKey,
        user: anchorProvider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .postInstructions([
        // make the transaction unique
        web3.SystemProgram.transfer({
          fromPubkey: anchorProvider.wallet.publicKey,
          toPubkey: anchorProvider.wallet.publicKey,
          lamports: 1,
        })
      ])
      .rpc()
      .then(
        () => Promise.reject(new Error('Expected to error!')),
        (e: anchor.web3.SendTransactionError) => {
          console.log(e.logs)
        }
      )
  })
});
