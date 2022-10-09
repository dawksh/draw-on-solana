import * as anchor from "@project-serum/anchor";
import { Program, AnchorError, web3 } from "@project-serum/anchor";
import { assert } from "chai";
import { Connection, clusterApiUrl } from '@solana/web3.js'
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
    const x = 20
    const y = 20

    const [pixelPublicKey] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("pixel"), Buffer.from([x, y])],
      program.programId,
    )

    // Create the pixel: this should pass
    await program.methods
      .createPixel(x, y, 0, 0, 255)
      .accounts({
        pixel: pixelPublicKey,
        user: anchorProvider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc()

    // Create the same pixel: this should fail
    await program.methods
      .createPixel(x, y, 0, 0, 255)
      .accounts({
        pixel: pixelPublicKey,
        user: anchorProvider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
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
        (e: web3.SendTransactionError) => {
          // Log is eg. 'Allocate: account Address { address: 6V4qyzgQ9zdDrjiP74hoaece98gLcRt874JFqTsexrQd, base: None } already in use'
          assert.ok(e.logs.some(log => log.includes(pixelPublicKey.toBase58()) && log.includes('already in use')))
        }
      )
  })

  it("Does not allow passing an incorrect address", async () => {
    // Generate the PDA for (0, 0)
    const [pixelPublicKey] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("pixel"), Buffer.from([0, 0])],
      program.programId,
    )

    // Attempt to use it to create (30, 30)
    await program.methods
      .createPixel(30, 30, 0, 0, 255)
      .accounts({
        pixel: pixelPublicKey,
        user: anchorProvider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc()
      .then(
        () => Promise.reject(new Error('Expected to error!')),
        (e: web3.SendTransactionError) => {
          // Log is eg. '5NbE1G4B95BMHrz94jLk3Q1GivRgh9Eyj8mtHss3sVZA's signer privilege escalated'
          const expectedError = `${pixelPublicKey.toBase58()}'s signer privilege escalated`
          assert.ok(e.logs.some(log => log === expectedError))
        }
      )
  })
});
