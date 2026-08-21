import List from './List.jsx';
import AddListForm from './AddListForm.jsx';

export default function Board({ lists, onAddList, onRenameList, onDeleteList, onAddCard, onOpenCard }) {
  return (
    <div className="board">
      {lists.map((list) => (
        <List
          key={list.id}
          list={list}
          onRename={onRenameList}
          onDelete={onDeleteList}
          onAddCard={onAddCard}
          onOpenCard={onOpenCard}
        />
      ))}
      <AddListForm onAdd={onAddList} />
    </div>
  );
}
