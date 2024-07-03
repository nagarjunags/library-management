import readline from "node:readline";
export const readChar = (question: string): Promise<string> => {
  console.log(question);
  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.setEncoding("utf8");
    const onData = async (key: Buffer) => {
      const char = key.toString("utf-8");
      process.stdin.setRawMode(false);
      resolve(char);
    };

    process.stdin.once("data", onData);
  });
};

export const readLine = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};
