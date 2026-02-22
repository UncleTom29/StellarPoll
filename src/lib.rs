#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec, Address, Env, Map, String, Vec,
};

#[contracttype]
#[derive(Clone)]
pub struct Poll {
    pub question: String,
    pub options: Vec<String>,
    pub votes: Map<u32, u32>,
    pub voters: Map<Address, bool>,
    pub active: bool,
}

#[contracttype]
pub enum DataKey {
    Poll,
    Admin,
}

#[contract]
pub struct PollContract;

#[contractimpl]
impl PollContract {
    pub fn init(
        env: Env,
        admin: Address,
        question: String,
        opt_a: String,
        opt_b: String,
        opt_c: String,
    ) {
        admin.require_auth();
        if env.storage().instance().has(&DataKey::Poll) {
            panic!("exists")
        }
        let mut votes: Map<u32, u32> = Map::new(&env);
        votes.set(0, 0);
        votes.set(1, 0);
        votes.set(2, 0);
        let poll = Poll {
            question,
            options: vec![&env, opt_a, opt_b, opt_c],
            votes,
            voters: Map::new(&env),
            active: true,
        };
        env.storage().instance().set(&DataKey::Poll, &poll);
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().extend_ttl(100_000, 100_000);
        env.events().publish((symbol_short!("CREATED"),), (true,));
    }

    pub fn vote(env: Env, voter: Address, option_index: u32) {
        voter.require_auth();
        let mut poll: Poll = env
            .storage()
            .instance()
            .get(&DataKey::Poll)
            .expect("noinit");
        if !poll.active {
            panic!("closed")
        }
        if poll.voters.contains_key(voter.clone()) {
            panic!("already voted")
        }
        if option_index > 2 {
            panic!("invalid")
        }
        let c = poll.votes.get(option_index).unwrap_or(0);
        poll.votes.set(option_index, c + 1);
        poll.voters.set(voter.clone(), true);
        env.storage().instance().set(&DataKey::Poll, &poll);
        env.storage().instance().extend_ttl(100_000, 100_000);
        env.events()
            .publish((symbol_short!("VOTED"),), (voter, option_index));
    }

    pub fn get_results(env: Env) -> (String, Vec<String>, Vec<u32>) {
        let poll: Poll = env
            .storage()
            .instance()
            .get(&DataKey::Poll)
            .expect("noinit");
        let mut c: Vec<u32> = Vec::new(&env);
        c.push_back(poll.votes.get(0).unwrap_or(0));
        c.push_back(poll.votes.get(1).unwrap_or(0));
        c.push_back(poll.votes.get(2).unwrap_or(0));
        (poll.question, poll.options, c)
    }

    pub fn has_voted(env: Env, voter: Address) -> bool {
        let poll: Poll = env
            .storage()
            .instance()
            .get(&DataKey::Poll)
            .expect("noinit");
        poll.voters.contains_key(voter)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Env;

    #[test]
    fn test_poll() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, PollContract);
        let client = PollContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.init(
            &admin,
            &String::from_str(&env, "Favorite color?"),
            &String::from_str(&env, "Red"),
            &String::from_str(&env, "Green"),
            &String::from_str(&env, "Blue"),
        );

        let voter = Address::generate(&env);
        client.vote(&voter, &0);

        assert!(client.has_voted(&voter));
        let (_, _, counts) = client.get_results();
        assert_eq!(counts.get(0).unwrap(), 1);
    }
}